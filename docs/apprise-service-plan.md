# Plan: Apprise Notification Service on Augustus

## Overview

Deploy the [Apprise API](https://github.com/caronc/apprise-api) as a containerized service on Augustus using podman (via `virtualisation.oci-containers`). Apprise provides a REST API and web frontend for sending notifications to dozens of services. Since the `apprise-api` server package is not available in nixpkgs (only the `apprise` Python library is), we run the official container image `caronc/apprise:latest`. Authentication is handled via mTLS client certificates at the Caddy reverse proxy layer since Apprise does not support OIDC.

## Service Details

| Property     | Value                                |
| ------------ | ------------------------------------ |
| Service name | `apprise`                            |
| Port         | `51571`                              |
| URL          | `https://apprise.plato-splunk.media` |
| Container    | `caronc/apprise:latest`              |
| User/Group   | `apprise` / `apprise`                |
| State dir    | `/var/lib/apprise`                   |
| Auth method  | mTLS client certificate (Caddy)      |
| Host         | Augustus                             |

---

## Step 1: Register in Service Registry

**File:** `nix-config/modules/service-registry.nix`

Add to `config.constants.services`:

```nix
apprise = {
  subdomain = "apprise";
  domain = mkDomain "apprise";
  url = mkUrl "apprise";
  port = 51571;
  stateDir = "/var/lib/apprise";
};
```

---

## Step 2: Create the Service Module

**File:** `nix-config/modules/services/apprise.nix`

This file defines the OCI container, user/group provisioning, state directories, Caddy vhost, and restic backup. Follows the same pattern as `planka.nix`.

```nix
{ config, ... }:
let
  c = config.constants;
  svc = c.services.apprise;

  appriseDir = svc.stateDir;
  configDir = "${appriseDir}/config";
  attachDir = "${appriseDir}/attach";
  pluginDir = "${appriseDir}/plugin";

  containerSecretKeyFile = "/run/secrets/apprise-secret-key";
in
{
  flake.modules.nixos.apprise =
    { config, lib, pkgs, ... }:
    {
      # User and group provisioning
      users.groups.apprise = {
        gid = 51571;
      };

      users.users.apprise = {
        uid = 51571;
        isSystemUser = true;
        group = "apprise";
        home = appriseDir;
        createHome = true;
      };

      # Ensure state directories exist with correct ownership
      systemd.tmpfiles.rules = [
        "d ${configDir} 0750 apprise apprise -"
        "d ${attachDir} 0750 apprise apprise -"
        "d ${pluginDir} 0750 apprise apprise -"
      ];

      # Container definition
      virtualisation.oci-containers.containers.apprise = {
        image = "caronc/apprise:latest";

        user = "${toString config.users.users.apprise.uid}:${toString config.users.groups.apprise.gid}";

        ports = [ "127.0.0.1:${builtins.toString svc.port}:8000" ];

        extraOptions = [
          "--cap-drop=ALL"
          "--security-opt=no-new-privileges:true"
          "--read-only"
          "--mount=type=tmpfs,dst=/tmp"
        ];

        volumes = [
          "${configDir}:/config"
          "${attachDir}:/attach"
          "${pluginDir}:/plugin"
          "${config.sops.secrets.apprise_secret_key.path}:${containerSecretKeyFile}:ro"
        ];

        environment = {
          APPRISE_STATEFUL_MODE = "simple";
          APPRISE_WORKER_COUNT = "1";
          APPRISE_ADMIN = "yes";
          APPRISE_CONFIG_LOCK = "no";
          ALLOWED_HOSTS = "apprise.plato-splunk.media localhost 127.0.0.1";
          LOG_LEVEL = "INFO";
          DEBUG = "no";
          SECRET_KEY_FILE = containerSecretKeyFile;
        };
      };

      # Caddy reverse proxy with mTLS client certificate requirement
      services.caddy.virtualHosts."${svc.url}" = {
        extraConfig = ''
          tls {
            client_auth {
              mode require_and_verify
              trust_pool file {
                pem_file ${c.ca.rootCert}
              }
            }
          }
          reverse_proxy 127.0.0.1:${builtins.toString svc.port}
        '';
      };

      # Restic backup
      services.restic.backups.apprise = {
        user = "restic";
        repository = "/mnt/backups/apprise";
        initialize = true;
        passwordFile = config.sops.secrets.apprise_restic_backup_passphrase.path;
        paths = [ configDir attachDir ];
        timerConfig = {
          OnCalendar = "Mon..Sun *-*-* 23:30:00";
          Persistent = true;
        };
        package = pkgs.writeShellScriptBin "restic" ''
          exec /run/wrappers/bin/restic "$@"
        '';
      };
    };
}
```

### Key Design Decisions

**Port binding:** Unlike Planka which uses `networks = [ "host" ]`, Apprise binds to `127.0.0.1:51571:8000`. The container listens on 8000 internally and is mapped to the configured port on localhost only. This avoids exposing the service directly on the network.

**Read-only rootfs:** The container runs with `--read-only` and a tmpfs at `/tmp` (where gunicorn/supervisord write PID files and sockets), matching the hardened deployment recommendations.

**Capability drop:** All Linux capabilities are dropped (`--cap-drop=ALL`) and privilege escalation is disabled (`--security-opt=no-new-privileges:true`).

**Secret injection:** The Django `SECRET_KEY` is mounted as a file from SOPS. Apprise supports `SECRET_KEY_FILE` for file-based secret loading.

---

## Step 3: Secrets (SOPS)

**File:** `nix-config/modules/_private/augustus/sops.nix`

Add:

```nix
sops.secrets.apprise_secret_key = {
  owner = "apprise";
  group = "apprise";
};

sops.secrets.apprise_restic_backup_passphrase = {
  owner = "restic";
};
```

**Secrets to add to `nix-config/secrets/augustus.yaml`:**

| Key                                | Purpose                      |
| ---------------------------------- | ---------------------------- |
| `apprise_secret_key`               | Django SECRET_KEY override   |
| `apprise_restic_backup_passphrase` | Restic backup encryption key |

Generate values:

```sh
# Django secret key (50 random chars)
openssl rand -base64 50 | tr -d '\n'

# Restic passphrase
openssl rand -base64 32 | tr -d '\n'
```

---

## Step 4: Register Module in Augustus Host

**File:** `nix-config/modules/hosts/augustus.nix`

Add `nixos.apprise` to the modules list:

```nix
modules = [
  # ... existing modules ...
  nixos.apprise
  # ...
];
```

---

## Step 5: Verify & Deploy

After adding the module:

1. Build the NixOS configuration:
   ```sh
   nix build .#nixosConfigurations.augustus.config.system.build.toplevel
   ```

2. Deploy (switch):
   ```sh
   nixos-rebuild switch --flake .#augustus
   ```

3. Verify the container is running:
   ```sh
   podman ps | grep apprise
   ```

4. Test health endpoint (with client cert):
   ```sh
   curl --cert client.crt --key client.key --cacert ca.crt \
     https://apprise.plato-splunk.media/status
   ```

5. Verify mTLS rejects unauthenticated requests:
   ```sh
   curl --cacert ca.crt https://apprise.plato-splunk.media/status
   # Should fail with 403/TLS handshake error
   ```

---

## Architecture Decisions

### Authentication: mTLS Client Certificates

Since Apprise has no native OIDC or authentication support, we enforce authentication at the reverse proxy layer using mutual TLS. Caddy requires a valid client certificate signed by our internal CA (step-ca). This means:

- Only devices with a client certificate issued by our CA can access the service
- No additional auth layer (basic auth, API keys) is needed at the application level
- Access is tied to certificate issuance — revoke the cert to revoke access

The Caddy config uses `client_auth` with `mode require_and_verify` and trusts certificates from our root CA PEM file.

### Why Not Basic Auth?

- Client certificates are already provisioned for all devices on the network
- Eliminates password management for yet another service
- Stronger security posture than basic auth over TLS
- Consistent with other mTLS-protected internal services

### Container Hardening

The following hardening measures are applied, aligned with Apprise's documented recommendations:

| Container Flag                     | Purpose                                   |
| ---------------------------------- | ----------------------------------------- |
| `--cap-drop=ALL`                   | Drop all Linux capabilities               |
| `--security-opt=no-new-privileges` | Prevent privilege escalation              |
| `--read-only`                      | Read-only root filesystem                 |
| `--mount=type=tmpfs,dst=/tmp`      | Ephemeral writable /tmp for runtime files |
| `user = "51571:51571"`             | Run as non-root (apprise user)            |
| `127.0.0.1:51571:8000`             | Bind only to localhost                    |

### Persistent Storage Layout

```
/var/lib/apprise/
├── config/    # Saved notification configurations (YAML files in simple mode)
├── attach/    # Uploaded attachments
└── plugin/    # Optional custom notification plugins
```

Backups cover `config/` and `attach/` (plugins are assumed to be reproducible or empty).

---

## Environment Variables Summary

| Variable                | Value                                            | Rationale                                           |
| ----------------------- | ------------------------------------------------ | --------------------------------------------------- |
| `APPRISE_STATEFUL_MODE` | `simple`                                         | Human-readable YAML configs, easy to inspect/backup |
| `APPRISE_WORKER_COUNT`  | `1`                                              | Low-traffic internal service                        |
| `APPRISE_ADMIN`         | `yes`                                            | Enable `/cfg` endpoint for key management in UI     |
| `APPRISE_CONFIG_LOCK`   | `no`                                             | Allow adding/modifying notification configs         |
| `ALLOWED_HOSTS`         | `apprise.plato-splunk.media localhost 127.0.0.1` | Restrict Django Host header                         |
| `SECRET_KEY_FILE`       | `/run/secrets/apprise-secret-key`                | Django secret key via mounted file                  |
| `LOG_LEVEL`             | `INFO`                                           | Standard logging                                    |
| `DEBUG`                 | `no`                                             | Production mode                                     |

---

## Checklist

- [ ] Add `apprise` entry to `service-registry.nix`
- [ ] Create `nix-config/modules/services/apprise.nix`
- [ ] Add SOPS secrets (`apprise_secret_key`, `apprise_restic_backup_passphrase`) to `nix-config/secrets/augustus.yaml`
- [ ] Add SOPS declarations to `nix-config/modules/_private/augustus/sops.nix`
- [ ] Add `nixos.apprise` to `nix-config/modules/hosts/augustus.nix`
- [ ] Create backup directory `/mnt/backups/apprise` on Augustus
- [ ] Build and deploy NixOS configuration
- [ ] Verify container is running (`podman ps`)
- [ ] Test health endpoint: `curl https://apprise.plato-splunk.media/status` (with client cert)
- [ ] Verify Caddy mTLS rejects requests without valid client certificates
- [ ] Verify restic backup runs successfully

---

## DNS

Ensure `apprise.plato-splunk.media` resolves to Augustus. This is likely handled by Tailscale MagicDNS or an existing wildcard DNS record for `*.plato-splunk.media`. If not, add an A/AAAA record pointing to Augustus's Tailscale IP.

---

## Future Considerations

- **Pin image version**: Once stable, pin `caronc/apprise:latest` to a specific version tag (e.g. `caronc/apprise:1.9`) to prevent unexpected upgrades.
- **Service filtering**: If memory is a concern, use `APPRISE_ALLOW_SERVICES` to restrict to only the notification schemas actually needed (e.g. `tgram,ntfy,slack,email`).
- **Prometheus metrics**: Apprise exposes `/metrics` — could be scraped if monitoring is added later.
- **Config lock**: Once notification configs are stable, set `APPRISE_CONFIG_LOCK=yes` to make config read-only.
