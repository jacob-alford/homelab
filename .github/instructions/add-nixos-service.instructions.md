# Adding a New NixOS Service

applyTo: "nix-config/modules/**"

## Overview

This repository uses the **Dendritic pattern** for NixOS configuration. Every `.nix` file
under `nix-config/modules/` (except `_private/`) is a **flake-parts module** auto-imported
via `import-tree`. Services are feature-centric, self-contained **aspects**.

When adding a new service, you create a single file that is the **feature closure** — it
contains everything that service needs: the service itself, reverse proxy entry, database,
OIDC client, SOPS secrets, backups, and user/group definitions.

## File Location

Create `nix-config/modules/services/<service-name>.nix`.

The file is auto-imported by `import-tree` — no changes to `flake.nix` or any import
list are needed.

## Service Registry

All service constants (domains, ports, client IDs, state directories) are centralized in
`nix-config/modules/service-registry.nix`. When adding a new service, **first register it
in the service registry**:

```nix
# In service-registry.nix, add to config.constants.services:
<service-name> = {
  subdomain = "<service-name>";
  domain = mkDomain "<service-name>";
  url = mkUrl "<service-name>";
  clientId = "<service-name>";
  port = <unique-port>;
  stateDir = "/var/lib/<service-name>";  # if stateful
};
```

The registry also provides infrastructure constants via `config.constants`:

- `c.baseDomain` — base domain (`plato-splunk.media`)
- `c.ca.acmeDirectory` — internal CA ACME endpoint
- `c.ca.rootCert` / `c.ca.intermediateCert` — certificate paths
- `c.idm.domain` / `c.idm.url` — Kanidm identity provider
- `c.idm.mkOidcEndpoint clientId` — generates the OIDC discovery URL
- `c.postgres.domain` / `c.postgres.port` — PostgreSQL connection info

## Module Structure

Every service file follows this skeleton:

```nix
{ config, inputs, ... }:
let
  c = config.constants;
  svc = c.services.<service-name>;
in
{
  flake.modules.nixos.<service-name> =
    { config, lib, pkgs, ... }:
    {
      # Service configuration (use svc.port, svc.domain, svc.url, etc.)
      # Caddy reverse proxy
      # ACME certificate (if needed)
      # Kanidm OIDC client (if authenticated)
      # PostgreSQL database (if needed)
      # SOPS secret references
      # Restic backup (if stateful)
      # User/group definitions (if needed)
    };
}
```

**Key rules:**

- The **outer** function takes `{ config, inputs, ... }` — `config` here is flake-parts config (for `config.constants`)
- The **inner** function takes `{ config, lib, pkgs, ... }` — `config` here is NixOS config (for `config.sops.secrets`, etc.)
- Constants flow into the NixOS module via **closure** over the outer `let` bindings
- It defines `flake.modules.nixos.<aspect-name>` (the aspect)
- Use `svc.*` for service-specific values, `c.*` for infrastructure constants
- Reference the flake source tree with `inputs.self + "/path"` (not relative paths)
- **Never hardcode domains, ports, or URLs** — always reference the service registry

## Adding to a Host

After creating the service file, add it to the host's module list in
`nix-config/modules/hosts/<hostname>.nix`. Host declarations use a `let` binding for brevity:

```nix
let
  nixos = inputs.self.modules.nixos;
in
{
  flake.nixosConfigurations.<hostname> = inputs.nixpkgs.lib.nixosSystem {
    modules = [
      # ... existing modules ...
      nixos.<service-name>
    ];
  };
}
```

**Note**: Do not use `with inputs.self.modules.nixos; [...]` — Nix parses hyphenated
names like `system-base` as subtraction. Use `let` bindings instead.

This is the **only other file** you need to modify.

## Caddy Reverse Proxy Entry

All web services are reverse-proxied through Caddy. Add a `virtualHosts` entry inside
your service module:

```nix
services.caddy.virtualHosts."https://${svc.domain}" = {
  extraConfig = ''
    reverse_proxy localhost:${builtins.toString svc.port}
  '';
};
```

For services that need ACME HTTP challenge proxying (when using the internal CA):

```nix
services.caddy.virtualHosts."http://${svc.domain}" = {
  extraConfig = ''
    reverse_proxy localhost:${builtins.toString svc.acmePort}
  '';
};
```

The `caddy.nix` aspect module handles the Caddy package and global configuration.
Individual services only add their own `virtualHosts` entries. NixOS merges them
automatically because multiple modules can contribute to the same option.

## PostgreSQL Database

If your service needs a database, use the custom `services.peesequel` module (defined
in `modules/services/postgres.nix`) for TLS-enabled PostgreSQL with certificate
authentication:

```nix
# Ensure the database exists
services.postgresql.ensureDatabases = [ "<service-name>" ];

# Ensure the user exists and owns the database
services.postgresql.ensureUsers = [
  {
    name = "<service-name>";
    ensureDBOwnership = true;
  }
];

# If the service needs password-based auth (e.g., containerized services)
services.peesequel.provisionPasswords = {
  <service-name> = config.sops.secrets.<service-name>_db_pass.path;
};
```

For services that connect via TLS to PostgreSQL, the connection string should use
`c.postgres.domain` and `sslmode=verify-full`.

**Important**: Database and user provisioning belongs in the service's aspect module
(or in `_private/<host>/programs.nix` if the database supports a service on a
_different_ host).

## Kanidm OIDC Client

For services that authenticate users via Kanidm (the identity provider):

### 1. Provision the OAuth2 client

```nix
services.kanidm.provision.systems.oauth2."${svc.clientId}" = {
  originUrl = "${svc.url}/callback-path";
  originLanding = "${svc.url}/";
  displayName = "Human-Readable Service Name";

  basicSecretFile = config.sops.secrets.<service-name>_client_secret.path;

  scopeMaps."<service-name>.access" = [
    "openid"
    "email"
    "profile"
  ];

  # Optional: role-based access via claim maps
  claimMaps.roles = {
    joinType = "array";
    valuesByGroup = {
      "<service-name>.admins" = [ "admin" ];
      "<service-name>.access" = [ "user" ];
    };
  };
};
```

### 2. Define the Kanidm groups

Groups are defined in `modules/services/kanidm.nix` under `services.kanidm.provision.groups`.
Add entries there for your service's access groups:

```nix
# In kanidm.nix, add to the groups attrset:
"<service-name>.access" = { };
"<service-name>.admins" = { };
```

Then assign users to those groups in `services.kanidm.provision.persons`.

### 3. Configure the service's OIDC settings

Use the `mkOidcEndpoint` helper from the service registry:

```nix
# In the outer let block:
c = config.constants;
oidcEndpoint = c.idm.mkOidcEndpoint svc.clientId;
```

This generates the OIDC discovery URL:
`https://idm.<baseDomain>/oauth2/openid/<clientId>/.well-known/openid-configuration`

**Best practice**: Put the OIDC client secret in a SOPS-managed secret, never inline.
Reference it via `config.sops.secrets.<name>.path`.

### 4. PKCE

Prefer `allowInsecureClientDisablePkce = false` (PKCE enabled). Only disable PKCE if
the service does not support it.

## SOPS Secrets

### Declaring secrets

Add secret entries to the host's `_private/<host>/sops.nix`:

```nix
sops.secrets.<service-name>_client_secret = {
  owner = "<service-user>";
  group = "<service-group>";
};
```

### Using secrets in environment files (preferred pattern)

**Never put secrets directly in environment variables or Nix expressions.** Use SOPS
templates to create environment files that are read at service startup:

```nix
sops.templates."<service-name>-env" = {
  owner = "<service-user>";
  group = "<service-group>";
  content = ''
    SECRET_KEY=${config.sops.placeholder."<service-name>_secret_key"}
    OAUTH_CLIENT_SECRET=${config.sops.placeholder."<service-name>_client_secret"}
  '';
};

# Reference via environmentFile, not environment:
services.<service-name> = {
  environmentFile = config.sops.templates."<service-name>-env".path;
};

# Or for systemd services:
systemd.services.<service-name>.serviceConfig = {
  EnvironmentFile = config.sops.templates."<service-name>-env".path;
};
```

### For container-based services

Mount secret files into the container rather than passing as environment variables:

```nix
virtualisation.oci-containers.containers.<service-name> = {
  volumes = [
    "${config.sops.secrets.<service-name>_secret.path}:/run/secrets/secret-key:ro"
  ];
  environment = {
    SECRET_KEY__FILE = "/run/secrets/secret-key";  # Use __FILE convention
  };
};
```

### Best practices for secrets

1. **Use `sops.templates` for environment files** — secrets are interpolated at runtime, never in the Nix store
2. **Use `*__FILE` environment variables** when the service supports it — point to the secret file path
3. **Never put secret values in `environment = { ... }`** — these end up in the Nix store (world-readable)
4. **Set `owner` and `group`** on secrets so only the service user can read them
5. **Use `passwordFile` / `secretFile` options** when the NixOS module provides them (e.g., `basicSecretFile` for Kanidm)
6. **SOPS secrets file path**: Use `inputs.self + "/nix-config/secrets/<host>.yaml"` for references, or set `sops.defaultSopsFile` in the host's `_private/<host>/sops.nix`

## Restic Backup

For stateful services, add a Restic backup job:

```nix
services.restic.backups.<service-name> = {
  user = "restic";
  repository = "/mnt/backups/<service-name>";
  initialize = true;
  passwordFile = config.sops.secrets.<service-name>_restic_backup_passphrase.path;
  paths = [ "<data-directory>" ];
  timerConfig = {
    OnCalendar = "Mon..Sun *-*-* 23:30:00";
    Persistent = true;
  };
  package = pkgs.writeShellScriptBin "restic" ''
    exec /run/wrappers/bin/restic "$@"
  '';
};
```

The `package` wrapper is needed because the `restic` aspect module installs Restic
with a setuid wrapper that has `CAP_DAC_READ_SEARCH` capability (for reading files
owned by other users).

## ACME Certificates (Internal CA)

If the service needs its own TLS certificate (separate from Caddy's):

```nix
security.acme.certs."${svc.domain}" = {
  domain = svc.domain;
  listenHTTP = "127.0.0.1:${builtins.toString svc.acmePort}";
  server = c.ca.acmeDirectory;
  group = "<cert-group>";
  reloadServices = [
    "caddy.service"
    "<service-name>.service"
  ];
};
```

The global ACME defaults (accept terms, email, default server) are in
`modules/services/acme.nix`.

## Complete Example: A Hypothetical "Wiki" Service

First, register the service in `nix-config/modules/service-registry.nix`:

```nix
# Add to config.constants.services:
wiki = {
  subdomain = "wiki";
  domain = mkDomain "wiki";
  url = mkUrl "wiki";
  clientId = "wiki";
  port = 3456;
  stateDir = "/var/lib/wiki";
};
```

Then create the service module:

```nix
# nix-config/modules/services/wiki.nix
{ config, inputs, ... }:
let
  c = config.constants;
  svc = c.services.wiki;
in
{
  flake.modules.nixos.wiki =
    { config, lib, pkgs, ... }:
    {
      # Kanidm OIDC client
      services.kanidm.provision.systems.oauth2."${svc.clientId}" = {
        originUrl = "${svc.url}/auth/callback";
        originLanding = "${svc.url}/";
        displayName = "Wiki";
        basicSecretFile = config.sops.secrets.wiki_client_secret.path;
        scopeMaps."wiki.access" = [ "openid" "email" "profile" ];
        claimMaps.roles = {
          joinType = "array";
          valuesByGroup = {
            "wiki.admins" = [ "admin" ];
            "wiki.access" = [ "user" ];
          };
        };
      };

      # PostgreSQL database
      services.postgresql.ensureDatabases = [ "wiki" ];
      services.postgresql.ensureUsers = [
        { name = "wiki"; ensureDBOwnership = true; }
      ];
      services.peesequel.provisionPasswords = {
        wiki = config.sops.secrets.wiki_db_pass.path;
      };

      # Environment file with secrets (NOT in nix store)
      sops.templates."wiki-env" = {
        owner = "wiki";
        group = "wiki";
        content = ''
          DATABASE_URL=postgresql://wiki:''${DATABASE_PASSWORD}@${c.postgres.domain}/wiki?sslmode=verify-full
          DATABASE_PASSWORD=${config.sops.placeholder."wiki_db_pass"}
          OIDC_CLIENT_ID=${svc.clientId}
          OIDC_CLIENT_SECRET=${config.sops.placeholder."wiki_client_secret"}
          OIDC_ISSUER=${c.idm.mkOidcEndpoint svc.clientId}
          SECRET_KEY=${config.sops.placeholder."wiki_secret_key"}
          SSL_CERT_FILE=${config.environment.etc."ssl/certs/ca-certificates.crt".source}
        '';
      };

      # The service itself
      systemd.services.wiki = {
        description = "Wiki Service";
        after = [ "network-online.target" "postgresql.service" ];
        wants = [ "network-online.target" ];
        wantedBy = [ "multi-user.target" ];
        serviceConfig = {
          Type = "simple";
          User = "wiki";
          Group = "wiki";
          EnvironmentFile = config.sops.templates."wiki-env".path;
          ExecStart = "${pkgs.wiki}/bin/wiki --port ${toString svc.port} --host 127.0.0.1";
          Restart = "on-failure";
          StateDirectory = "wiki";
        };
      };

      # Caddy reverse proxy
      services.caddy.virtualHosts."${svc.url}" = {
        extraConfig = ''
          reverse_proxy localhost:${builtins.toString svc.port}
        '';
      };

      # Restic backup
      services.restic.backups.wiki = {
        user = "restic";
        repository = "/mnt/backups/wiki";
        initialize = true;
        passwordFile = config.sops.secrets.wiki_restic_backup_passphrase.path;
        paths = [ svc.stateDir ];
        timerConfig = {
          OnCalendar = "Mon..Sun *-*-* 23:30:00";
          Persistent = true;
        };
        package = pkgs.writeShellScriptBin "restic" ''
          exec /run/wrappers/bin/restic "$@"
        '';
      };

      # User and group
      users.users.wiki = {
        isSystemUser = true;
        group = "wiki";
        home = svc.stateDir;
      };
      users.groups.wiki = { };
    };
}
```

Then add the SOPS secrets to `_private/augustus/sops.nix`:

```nix
sops.secrets.wiki_client_secret = { owner = "wiki"; group = "wiki"; };
sops.secrets.wiki_db_pass = { owner = "wiki"; group = "wiki"; };
sops.secrets.wiki_secret_key = { owner = "wiki"; group = "wiki"; };
sops.secrets.wiki_restic_backup_passphrase = { owner = "restic"; };
```

Add the Kanidm groups to `modules/services/kanidm.nix`:

```nix
"wiki.access" = { };
"wiki.admins" = { };
```

Add users to groups in `kanidm.nix` `provision.persons`.

Add the module to the host in `modules/hosts/augustus.nix`:

```nix
nixos.wiki
```

Encrypt the secret values in `nix-config/secrets/augustus.yaml` using `sops`.

## Anti-Patterns to Avoid

1. **Do not put secrets in `environment = { ... }`** — use `environmentFile` or `*__FILE` patterns
2. **Do not name modules after hosts** — name them after the feature (`wiki.nix`, not `augustus-wiki.nix`)
3. **Do not create `default.nix` import files** — `import-tree` handles auto-importing
4. **Do not use relative paths to flake source files** — use `inputs.self + "/path"` to avoid derivation hash changes
5. **Do not split a service's config across multiple aspect modules** — keep the feature closure in one file (the service file can reference other aspects like `services.caddy.virtualHosts` and `services.kanidm.provision` because NixOS merges option values from all modules)
6. **Do not put service-specific SOPS secret _declarations_ in the service module** — they reference host-specific SOPS files and belong in `_private/<host>/sops.nix`. The service module _uses_ `config.sops.secrets.*` and `config.sops.templates.*` but the actual `sops.secrets.<name> = { ... }` declarations go in the host's private sops file
7. **Do not use `specialArgs`** for new code — use `inputs` from the flake-parts module argument or `let` bindings to share values
8. **Do not hardcode domains, ports, or URLs** — register them in `service-registry.nix` and reference via `c.*` / `svc.*`
9. **Do not confuse the two `config` scopes** — outer `config` (flake-parts) has `config.constants`; inner `config` (NixOS) has `config.sops.secrets`, `config.services`, etc.
