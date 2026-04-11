# Building and Deploying Node.js Services with Nix

This document describes how to package, build, and deploy Node.js backend services
(like `homelab-server`) from the homelab monorepo as NixOS systemd services.

## Prerequisites

### Zero-Installs Setup

The monorepo uses Yarn Berry v4 with PnP (`nodeLinker: pnp`). For Nix builds to work
in a pure sandbox (no network access), all dependencies must be available locally via
Yarn's zero-installs pattern.

**Complete the zero-installs setup:**

1. Add `enableGlobalCache: false` to `.yarnrc.yml` — this tells Yarn to store
   dependency zips in `.yarn/cache/` inside the project instead of `~/.yarn/berry/cache/`
2. Run `yarn install` to populate `.yarn/cache/`
3. Ensure `.gitignore` does NOT ignore `.yarn/cache/`
4. Commit `.yarn/cache/`, `.pnp.cjs`, and `.pnp.loader.mjs` to the repository

After setup, the repository is fully self-contained — `yarn install --immutable`
succeeds with no network access.

### Bundling Strategy

Every deployable Node.js service **must** produce a single bundled JavaScript file using
rolldown. This is critical for Nix because:

- The bundled output is self-contained (all workspace deps inlined)
- No PnP runtime resolution needed in production
- The Nix derivation output is minimal (one `.js` file + a wrapper script)
- `node main.js` is the only runtime requirement

## Nix Package Derivation

Each Node.js service gets a Nix derivation in `nix-config/modules/packages/`. The
derivation copies the entire monorepo source (since workspace packages reference each
other), runs the Yarn PnP build, and extracts the single bundled file.

### File Location

Create `nix-config/modules/packages/<package-name>.nix`.

### Derivation Pattern

```nix
{ config, inputs, ... }:
{
  flake.packages.x86_64-linux.<package-name> =
    let
      pkgs = inputs.nixpkgs.legacyPackages.x86_64-linux;
    in
    pkgs.stdenv.mkDerivation {
      pname = "<package-name>";
      version = "<version>";

      src = inputs.self;

      nativeBuildInputs = [
        pkgs.nodejs_24
        pkgs.yarn-berry
      ];

      # Yarn needs a writable home for config
      buildPhase = ''
        export HOME=$TMPDIR
        yarn install --immutable
        yarn workspace <package-name> build
      '';

      installPhase = ''
        mkdir -p $out/lib $out/bin

        cp packages/<package-name>/dist/bundle.js $out/lib/<package-name>.js

        cat > $out/bin/<package-name> <<'EOF'
        #!/bin/sh
        exec ${pkgs.nodejs_24}/bin/node $out/lib/<package-name>.js "$@"
        EOF
        chmod +x $out/bin/<package-name>
      '';
    };
}
```

**Key points:**

- `src = inputs.self` — the entire flake source tree (includes `.yarn/cache/`,
  `.pnp.cjs`, and all workspace packages)
- `yarn install --immutable` — reconstructs the PnP state from the committed cache
  with zero network access (fails if anything is missing)
- The wrapper script pins the exact `nodejs_24` from the Nix store so there's no
  runtime dependency on the system PATH

### Rolldown Configuration

Each service needs a `rolldown.config.mjs` (already present for `homelab-server`):

```js
import { defineConfig } from "rolldown"

export default defineConfig({
  input: "./src/main.ts",
  output: { file: "./dist/bundle.js" },
  platform: "node",
})
```

Ensure `platform: "node"` is set — this tells rolldown to treat Node.js built-ins
(`http`, `fs`, `path`, etc.) as external.

## NixOS Service Module

The service module lives in `nix-config/modules/services/<service-name>.nix` and
follows the standard dendritic pattern.

### Service Registry

First, register the service in `service-registry.nix`:

```nix
<service-name> = {
  subdomain = "<service-name>";
  domain = mkDomain "<service-name>";
  url = mkUrl "<service-name>";
  port = <port>;
};
```

### Service Module

```nix
{ config, inputs, ... }:
let
  c = config.constants;
  svc = c.services.<service-name>;
  pkg = inputs.self.packages.x86_64-linux.<package-name>;
in
{
  flake.modules.nixos.<service-name> =
    { config, lib, pkgs, ... }:
    {
      # Environment file with secrets (never in Nix store)
      sops.templates."<service-name>-env" = {
        owner = "<service-user>";
        group = "<service-group>";
        content = ''
          BASE_PATH=${pkg}/lib
          PORT=${builtins.toString svc.port}
          # Add other env vars referencing config.sops.placeholder as needed
        '';
      };

      systemd.services.<service-name> = {
        description = "<Service description>";
        after = [ "network-online.target" ];
        wants = [ "network-online.target" ];
        wantedBy = [ "multi-user.target" ];
        serviceConfig = {
          Type = "simple";
          User = "<service-user>";
          Group = "<service-group>";
          EnvironmentFile = config.sops.templates."<service-name>-env".path;
          ExecStart = "${pkg}/bin/<package-name>";
          Restart = "on-failure";
          RestartSec = 5;

          # Hardening
          NoNewPrivileges = true;
          ProtectSystem = "strict";
          ProtectHome = true;
          PrivateTmp = true;
        };
      };

      # Caddy reverse proxy
      services.caddy.virtualHosts."${svc.url}" = {
        extraConfig = ''
          reverse_proxy localhost:${builtins.toString svc.port}
        '';
      };

      # User and group
      users.users.<service-user> = {
        isSystemUser = true;
        group = "<service-group>";
      };
      users.groups.<service-group> = { };
    };
}
```

### Configuration via Environment Variables

Node.js services should read all configuration from environment variables. The
`Effect` library's `Config` module makes this natural:

```typescript
const port = yield * Config.number("PORT")
const basePath = yield * Config.string("BASE_PATH")
```

Secrets come from SOPS templates (see the dendritic pattern docs). Non-secret config
can go directly in the systemd `environment` attrset.

## Concrete Example: homelab-server

### Package: `nix-config/modules/packages/homelab-server.nix`

```nix
{ config, inputs, ... }:
{
  flake.packages.x86_64-linux.homelab-server =
    let
      pkgs = inputs.nixpkgs.legacyPackages.x86_64-linux;
    in
    pkgs.stdenv.mkDerivation {
      pname = "homelab-server";
      version = "0.0.0";

      src = inputs.self;

      nativeBuildInputs = [
        pkgs.nodejs_24
        pkgs.yarn-berry
      ];

      buildPhase = ''
        export HOME=$TMPDIR
        yarn install --immutable
        yarn workspace homelab-server build
      '';

      installPhase = ''
        mkdir -p $out/lib $out/bin

        cp packages/homelab-server/dist/bundle.js $out/lib/homelab-server.js

        cat > $out/bin/homelab-server <<'WRAPPER'
        #!/bin/sh
        exec ${pkgs.nodejs_24}/bin/node $out/lib/homelab-server.js "$@"
        WRAPPER
        chmod +x $out/bin/homelab-server
      '';
    };
}
```

### Service: `nix-config/modules/services/homelab-server.nix`

```nix
{ config, inputs, ... }:
let
  c = config.constants;
  svc = c.services.homelab-server;
  pkg = inputs.self.packages.x86_64-linux.homelab-server;
in
{
  flake.modules.nixos.homelab-server =
    { config, lib, pkgs, ... }:
    {
      sops.templates."homelab-server-env" = {
        owner = "homelab-server";
        group = "homelab-server";
        content = ''
          PORT=${builtins.toString svc.port}
          BASE_PATH=${pkg}/lib
          ROOT_CERT=${c.ca.rootCert}
          INTERMEDIATE_CERT=${c.ca.intermediateCert}
        '';
      };

      systemd.services.homelab-server = {
        description = "Homelab API Server";
        after = [ "network-online.target" ];
        wants = [ "network-online.target" ];
        wantedBy = [ "multi-user.target" ];
        serviceConfig = {
          Type = "simple";
          User = "homelab-server";
          Group = "homelab-server";
          EnvironmentFile = config.sops.templates."homelab-server-env".path;
          ExecStart = "${pkg}/bin/homelab-server";
          Restart = "on-failure";
          RestartSec = 5;
          NoNewPrivileges = true;
          ProtectSystem = "strict";
          ProtectHome = true;
          PrivateTmp = true;
        };
      };

      services.caddy.virtualHosts."${svc.url}" = {
        extraConfig = ''
          reverse_proxy localhost:${builtins.toString svc.port}
        '';
      };

      users.users.homelab-server = {
        isSystemUser = true;
        group = "homelab-server";
      };
      users.groups.homelab-server = { };
    };
}
```

## Build and Test Workflow

```bash
# Build the Nix package locally
nix build .#homelab-server

# Inspect the output
ls -la result/bin/ result/lib/

# Test the binary
./result/bin/homelab-server
```

## Checklist for Adding a New Node.js Service

1. Create the package directory under `packages/<name>/`
2. Add a `rolldown.config.mjs` that outputs a single `dist/bundle.js`
3. Add `"build": "rolldown -c"` to the package's `package.json` scripts
4. Register the service in `service-registry.nix` (subdomain, domain, url, port)
5. Create `nix-config/modules/packages/<name>.nix` with the derivation
6. Create `nix-config/modules/services/<name>.nix` with the systemd + Caddy config
7. Add SOPS secrets to `_private/<host>/sops.nix` if needed
8. Add the module to the host in `nix-config/modules/hosts/<host>.nix`
9. Test with `nix build .#<name>` before deploying
