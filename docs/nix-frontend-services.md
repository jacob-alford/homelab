# Building and Deploying Frontend Packages with Nix

This document describes how to package, build, and deploy static frontend applications
(like `homelab-frontend`) from the homelab monorepo, served via Caddy on NixOS.

## Prerequisites

Same as the [Node.js services doc](./nix-nodejs-services.md#prerequisites) — Yarn Berry
PnP with zero-installs must be set up so the Nix sandbox can build without network
access.

## Build Strategy

Frontend packages (Astro, Vite, SolidJS, etc.) compile to a static `dist/` directory
containing HTML, CSS, JS, and assets. Unlike Node.js services, there is:

- No runtime process — Caddy serves the files directly.
- No wrapper script — the Nix output is just the static directory
- No systemd service — only a Caddy `virtualHosts` entry

## Nix Package Derivation

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

      buildPhase = ''
        export HOME=$TMPDIR
        yarn install --immutable
        yarn workspace <package-name> build
      '';

      installPhase = ''
        mkdir -p $out
        cp -r packages/<package-name>/dist/* $out/
      '';
    };
}
```

**Key differences from Node.js services:**

- `installPhase` copies the entire `dist/` directory contents to `$out`
  (no `bin/` or `lib/` subdirectory)
- No wrapper script needed
- `$out` IS the document root for Caddy

## NixOS Service Module (Caddy Only)

Frontend packages don't need a systemd service. The module just adds a Caddy
`virtualHosts` entry to serve the static files.

### Service Registry

Register in `service-registry.nix`:

```nix
<frontend-name> = {
  subdomain = "<frontend-name>";
  domain = mkDomain "<frontend-name>";
  url = mkUrl "<frontend-name>";
};
```

No port is needed — Caddy serves the files directly over HTTPS.

### Service Module

```nix
{ config, inputs, ... }:
let
  c = config.constants;
  svc = c.services.<frontend-name>;
  pkg = inputs.self.packages.x86_64-linux.<package-name>;
in
{
  flake.modules.nixos.<frontend-name> =
    { config, lib, pkgs, ... }:
    {
      services.caddy.virtualHosts."${svc.url}" = {
        extraConfig = ''
          root * ${pkg}
          file_server

          # SPA fallback (if the frontend uses client-side routing)
          try_files {path} /index.html
        '';
      };
    };
}
```

### Non-SPA Static Sites

For static sites without client-side routing (like a standard Astro build in static
mode), omit the `try_files` directive:

```nix
services.caddy.virtualHosts."${svc.url}" = {
  extraConfig = ''
    root * ${pkg}
    file_server

    # Custom error page (optional)
    handle_errors {
      respond "{err.status_code} {err.status_text}"
    }
  '';
};
```

### API Proxy Passthrough

If the frontend needs to proxy API calls to a backend service (e.g. `homelab-server`),
add a `handle` block:

```nix
services.caddy.virtualHosts."${svc.url}" = {
  extraConfig = ''
    handle /api/* {
      reverse_proxy localhost:${builtins.toString c.services.homelab-server.port}
    }

    handle {
      root * ${pkg}
      file_server
      try_files {path} /index.html
    }
  '';
};
```

## Concrete Example: homelab-frontend

### Package: `nix-config/modules/packages/homelab-frontend.nix`

```nix
{ config, inputs, ... }:
{
  flake.packages.x86_64-linux.homelab-frontend =
    let
      pkgs = inputs.nixpkgs.legacyPackages.x86_64-linux;
    in
    pkgs.stdenv.mkDerivation {
      pname = "homelab-frontend";
      version = "0.0.1";

      src = inputs.self;

      nativeBuildInputs = [
        pkgs.nodejs_24
        pkgs.yarn-berry
      ];

      buildPhase = ''
        export HOME=$TMPDIR
        yarn install --immutable
        yarn workspace homelab-frontend build
      '';

      installPhase = ''
        mkdir -p $out
        cp -r packages/homelab-frontend/dist/* $out/
      '';
    };
}
```

### Service: `nix-config/modules/services/homelab-frontend.nix`

```nix
{ config, inputs, ... }:
let
  c = config.constants;
  svc = c.services.homelab-frontend;
  pkg = inputs.self.packages.x86_64-linux.homelab-frontend;
in
{
  flake.modules.nixos.homelab-frontend =
    { config, lib, pkgs, ... }:
    {
      services.caddy.virtualHosts."${svc.url}" = {
        extraConfig = ''
          handle /api/* {
            reverse_proxy localhost:${builtins.toString c.services.homelab-server.port}
          }

          handle {
            root * ${pkg}
            file_server
          }
        '';
      };
    };
}
```

## Build and Test Workflow

```bash
# Build the Nix package
nix build .#homelab-frontend

# Inspect the output (should be static files)
ls result/
# Expected: index.html, _astro/, favicon.svg, etc.

# Preview locally with any static server
python3 -m http.server -d result/ 8080
```

## Astro Configuration Notes

### Static Output (Default)

Astro builds to static HTML by default. This is ideal for Caddy — no Node.js runtime
needed. The current `astro.config.mjs` already uses the default static output:

```js
import solidJs from "@astrojs/solid-js"
import { defineConfig } from "astro/config"

export default defineConfig({
  integrations: [solidJs()],
})
```

### SSR Output (If Needed Later)

If the frontend ever needs server-side rendering, it would switch from a static Caddy
module to a Node.js service module (same pattern as `homelab-server`). Astro supports
a Node.js adapter:

```js
import node from "@astrojs/node"

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
})
```

In that case, follow the Node.js services doc instead, bundling the SSR server and
running it as a systemd service behind a Caddy reverse proxy.

## Checklist for Adding a New Frontend Package

1. Create the package directory under `packages/<name>/`
2. Ensure `build` script in `package.json` outputs to `dist/`
3. Register the service in `service-registry.nix` (subdomain, domain, url — no port)
4. Create `nix-config/modules/packages/<name>.nix` with the derivation
5. Create `nix-config/modules/services/<name>.nix` with the Caddy config
6. Add the module to the host in `nix-config/modules/hosts/<host>.nix`
7. Test with `nix build .#<name>` and inspect `result/` before deploying
