# Base-Path Support Plan: homelab-api & homelab-ui

This document covers the changes needed to make homelab-api (effect-http server) and homelab-ui (Astro SSG) work under sub-paths (`/api` and `/ui`) for the praeconinus deployment at `https://praeconinus.neko-bicolor.ts.net`.

## Context

Currently, both services assume they are hosted at the root of their respective domains:

- homelab-api at `https://homelab-api.plato-splunk.media/`
- homelab-ui at `https://homelab.plato-splunk.media/`

For praeconinus, they share a single domain under sub-paths:

- API: `https://praeconinus.neko-bicolor.ts.net/api/...`
- UI: `https://praeconinus.neko-bicolor.ts.net/ui/...`

Caddy's `handle_path` strips the prefix before forwarding, so the API still receives requests at `/health`, `/wifi/config`, etc. The UI static files are served from a root that maps correctly after prefix stripping.

---

## Part 1: homelab-api (effect-http)

### What Works Already

The API routes are defined at `/` (e.g. `/health`, `/wifi/config`). Caddy's `handle_path /api/*` strips the prefix before forwarding, so **no route changes are needed**.

### Required Changes

1. **Set `HOMELAB_ORIGIN_URL` to include the base path in the Nix env template for praeconinus:**
   ```
   HOMELAB_ORIGIN_URL=https://praeconinus.neko-bicolor.ts.net/api
   ```

2. **Audit `HOMELAB_ORIGIN_URL` / `originUrl` usage** — ensure any code that appends paths handles a URL with a trailing path segment. Specifically:
   - OIDC redirect URI construction (not applicable on praeconinus since OIDC is disabled)
   - Any `Location` headers or self-referential links

3. **CORS** — Since UI and API share the same origin (`praeconinus.neko-bicolor.ts.net`), same-origin policy applies. No CORS headers needed. Verify the API doesn't reject same-origin requests.

### Guest Access Control (Resolved)

No additional protection is needed. The authorization stack already secures unauthenticated access:

- **Identity layer**: `GuestIdentity` has a fixed permission set: `Config_Wifi.view`, `Config_Wifi.create`, `Config_Certs.view`, `Config_Certs.create`, `Status_Health.view`
- **Feature flag layer**: Praeconinus enables only `Config_Wifi.create` and `Config_Certs.view`, blocking everything else regardless of guest permissions
- **FGA layer**: For `Config_Wifi.create`, guests can only create profiles where `username === "guest"` (the FGA check enforces that the payload username matches the identity's principle, which is `"guest"` for `GuestIdentity`)

Effective guest access on praeconinus:

| Operation                             | Result | Reason                                        |
| ------------------------------------- | ------ | --------------------------------------------- |
| `Config_Wifi.create` (username=guest) | ✓      | Permitted + feature flag enabled + FGA passes |
| `Config_Wifi.create` (username≠guest) | ✗      | FGA rejects (principle mismatch)              |
| `Config_Certs.view`                   | ✓      | Permitted + feature flag enabled              |
| Everything else                       | ✗      | Feature flag disabled                         |

### Verification

- `GET /api/health` → 200
- `POST /api/wifi/config` from `/ui` page → works (same-origin)
- `POST /api/wifi/config` with non-guest username → 403

---

## Part 2: homelab-ui (Astro SSG)

### 2.1 Astro Base Path

Add `base` to `astro.config.mjs`, driven by env var so it defaults to `/` for existing deployments:

```javascript
export default defineConfig({
  base: process.env.PUBLIC_BASE_PATH || "/",
  // ...existing
})
```

This causes Astro to prefix all generated asset URLs (scripts, styles, images) with the base path. The browser requests `/ui/assets/...`, Caddy strips `/ui`, serves `assets/...` from package root. ✓

### 2.2 URL ↔ Store Sync (No Change Needed)

The `$wifiParams` store uses `window.location.pathname` in `history.replaceState`:

```typescript
const newUrl = qs
  ? `${window.location.pathname}?${qs}`
  : window.location.pathname
```

This already includes the full path (e.g. `/ui/`) at runtime, so no base-path adjustment is needed.

### 2.3 Make OIDC Optional

The OIDC provider (Kanidm) is not accessible from the public endpoint. OIDC env vars will be empty for praeconinus. The frontend needs to gracefully degrade.

#### Config Layer

**`src/lib/config-provider.ts`** — no change needed (already defaults to `""`)

**New: `src/lib/auth/enabled.ts`** — derive an OIDC-enabled flag at build time:

```typescript
export const oidcEnabled: boolean = !!import.meta.env.PUBLIC_OIDC_CLIENT_ID &&
  !!import.meta.env.PUBLIC_OIDC_WELL_KNOWN_URL
```

#### Store Layer

**`src/lib/auth/state.ts`** — export an atom:

```typescript
import { atom } from "nanostores"
import { oidcEnabled } from "./enabled"

export const $oidcEnabled = atom(oidcEnabled)
```

#### Container Layer

**`src/components/WifiPage/WifiPage.tsx`** — subscribe to `$oidcEnabled`, pass to view. When `false`, skip auth subscriptions and don't wire up login handler.

#### View Layer

**`src/components/WifiPage/WifiPageView.tsx`** — add `oidcEnabled` prop, wrap Login/Logout button:

```tsx
<Show when={props.oidcEnabled}>
  {/* login/logout button */}
</Show>
```

**`src/components/WifiPage/AppleTab.tsx`** — add `oidcEnabled` prop, gate auth-dependent sections (username/password override, "Copy Download Link"):

```tsx
<Show when={props.oidcEnabled && props.isAuthenticated}>
  {/* auth-gated UI */}
</Show>
```

#### Effects

`login()` in `src/lib/auth/flow.ts` — already unreachable when button is hidden. Optionally add early guard:

```typescript
import { oidcEnabled } from "./enabled"
export const login = Effect.fn("login")(function*() {
  if (!oidcEnabled) return
  // ...existing
})
```

#### OAuth Callback Page

Keep `src/pages/oauth/callback.astro` as-is — harmless if reached without OIDC configured.

---

## Part 3: Nix Package Changes

### 3.1 `nix-config/modules/features/homelab-ui/package.nix`

Refactor into a shared builder, add `aarch64-linux` output in the same file:

```nix
{ self, config, inputs, ... }:
let
  c = config.constants;
  svc = c.services.homelab;

  mkHomelabUi = { pkgs, apiBaseUrl, basePath ? "/", oidcWellKnownUrl ? "", oidcClientId ? "", idmUrl ? "" }:
    let
      filter = inputs.nix-filter.lib;
      fetcher = pkgs.yarn-berry_4-fetcher;
      src = filter { /* ...existing filter... */ };
      missingHashes = "${self}/missing-hashes.json";
      yarnOfflineCache = fetcher.fetchYarnBerryDeps { inherit src missingHashes; hash = "..."; };
    in
    pkgs.stdenv.mkDerivation {
      pname = "homelab-ui";
      version = "0.0.1";
      inherit src yarnOfflineCache missingHashes;
      nativeBuildInputs = [ pkgs.nodejs_26 pkgs.yarn-berry fetcher.yarnBerryConfigHook ];
      YARN_ENABLE_SCRIPTS = "0";
      buildPhase = ''
        runHook preBuild
        export PUBLIC_API_BASE_URL="${apiBaseUrl}"
        export PUBLIC_BASE_PATH="${basePath}"
        export PUBLIC_OIDC_WELL_KNOWN_URL="${oidcWellKnownUrl}"
        export PUBLIC_OIDC_CLIENT_ID="${oidcClientId}"
        export PUBLIC_IDM_URL="${idmUrl}"
        yarn workspace homelab-frontend build
        runHook postBuild
      '';
      installPhase = ''
        runHook preInstall
        mkdir -p $out
        cp -r packages/homelab-frontend/dist/* $out/
        runHook postInstall
      '';
    };
in
{
  flake.packages.x86_64-linux.homelab-ui = mkHomelabUi {
    pkgs = inputs.nixpkgs.legacyPackages.x86_64-linux;
    apiBaseUrl = svc.url;
    oidcWellKnownUrl = svc.oidcEndpoint;
    oidcClientId = svc.clientId;
    idmUrl = c.idm.url;
  };

  flake.packages.aarch64-linux.homelab-ui = mkHomelabUi {
    pkgs = inputs.nixpkgs.legacyPackages.aarch64-linux;
    apiBaseUrl = "https://praeconinus.neko-bicolor.ts.net/api";
    basePath = "/ui";
  };
}
```

### 3.2 `nix-config/modules/features/homelab-api/package.nix`

Same pattern — shared builder, add `aarch64-linux` in the same file:

```nix
{ self, config, inputs, ... }:
let
  mkHomelabApi = { pkgs }:
    let
      filter = inputs.nix-filter.lib;
      fetcher = pkgs.yarn-berry_4-fetcher;
      src = filter { /* ...existing... */ };
      missingHashes = "${self}/missing-hashes.json";
      yarnOfflineCache = fetcher.fetchYarnBerryDeps { inherit src missingHashes; hash = "..."; };
    in
    pkgs.stdenv.mkDerivation {
      pname = "homelab-api";
      version = "0.1.0";
      inherit src yarnOfflineCache missingHashes;
      nativeBuildInputs = [ pkgs.nodejs_26 pkgs.yarn-berry fetcher.yarnBerryConfigHook ];
      YARN_ENABLE_SCRIPTS = "0";
      buildPhase = ''
        runHook preBuild
        yarn workspace homelab-server build
        runHook postBuild
      '';
      installPhase = ''
        runHook preInstall
        mkdir -p $out/lib $out/bin
        cp packages/homelab-server/dist/bundle.js $out/lib/homelab-api.js
        cat > $out/bin/homelab-api <<EOF
        #!/bin/sh
        exec ${pkgs.nodejs_26}/bin/node $out/lib/homelab-api.js "\$@"
        EOF
        chmod +x $out/bin/homelab-api
        runHook postInstall
      '';
    };
in
{
  flake.packages.x86_64-linux.homelab-api = mkHomelabApi {
    pkgs = inputs.nixpkgs.legacyPackages.x86_64-linux;
  };

  flake.packages.aarch64-linux.homelab-api = mkHomelabApi {
    pkgs = inputs.nixpkgs.legacyPackages.aarch64-linux;
  };
}
```

### 3.3 `nix-config/modules/features/homelab-api/systemd-service.nix`

Change the default package reference from hardcoded x86_64 to host platform:

```nix
# Before:
pkg = inputs.self.packages.x86_64-linux.homelab-api;

# After:
pkg = inputs.self.packages.${pkgs.stdenv.hostPlatform.system}.homelab-api;
```

---

## Part 4: Change Summary

### Frontend Code Changes

| File                                       | Change                                               |
| ------------------------------------------ | ---------------------------------------------------- |
| `astro.config.mjs`                         | Add `base: process.env.PUBLIC_BASE_PATH \|\| '/'`    |
| `src/lib/auth/enabled.ts`                  | New file — exports `oidcEnabled` boolean constant    |
| `src/lib/auth/state.ts`                    | Export `$oidcEnabled` atom                           |
| `src/components/WifiPage/WifiPage.tsx`     | Pass `oidcEnabled` to view                           |
| `src/components/WifiPage/WifiPageView.tsx` | Add `oidcEnabled` prop, gate login/logout UI         |
| `src/components/WifiPage/AppleTab.tsx`     | Add `oidcEnabled` prop, gate auth-dependent sections |
| `src/lib/auth/flow.ts`                     | Optional early guard in `login()`                    |

### Nix Changes

| File                                       | Change                                                            |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `features/homelab-api/package.nix`         | Refactor to `mkHomelabApi`, add `aarch64-linux` output            |
| `features/homelab-ui/package.nix`          | Refactor to `mkHomelabUi` with params, add `aarch64-linux` output |
| `features/homelab-api/systemd-service.nix` | Use `pkgs.stdenv.hostPlatform.system` for default pkg             |

---

## Part 5: Backward Compatibility

- `PUBLIC_BASE_PATH` unset → defaults to `/` → astro generates root-relative paths (unchanged for augustus)
- `PUBLIC_OIDC_CLIENT_ID` / `PUBLIC_OIDC_WELL_KNOWN_URL` set → `oidcEnabled = true` → login UI shows (unchanged for augustus)
- `x86_64-linux` packages unchanged in behavior — just refactored into a shared builder
- Existing Caddy vhosts on augustus untouched

---

## Part 6: Testing

1. **Augustus (regression):**
   - Build `homelab-ui` for x86_64-linux with all OIDC vars → login button present, auth flow works

2. **Praeconinus (new):**
   - Build `homelab-ui` for aarch64-linux with empty OIDC vars → login button absent
   - Static assets load under `/ui/` base path
   - API calls from UI target `/api/...` correctly
   - Guest can only create wifi config with username "guest"

3. **Local dev:**
   ```bash
   # Test base path + no OIDC
   PUBLIC_BASE_PATH=/ui PUBLIC_API_BASE_URL=http://localhost:35427 \
     PUBLIC_OIDC_CLIENT_ID="" PUBLIC_OIDC_WELL_KNOWN_URL="" \
     yarn workspace homelab-frontend dev
   ```

---

## Remaining Open Questions

1. **SPA fallback**: Astro SSG generates per-page HTML files. If all routes have corresponding `.html` files, no `try_files` fallback needed in Caddy. Verify the Astro build output structure.

2. **`PUBLIC_IDM_URL` in AppleTab**: When OIDC is disabled, the IDM link is naturally hidden since it's inside the auth-gated `<Show>` block.
