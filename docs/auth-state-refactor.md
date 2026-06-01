# Auth State Refactor

## Problem

The current auth state is scattered and requires re-parsing on every access:

1. `$token` is an `atom<TokenResponse | null>` — raw token blob or null.
2. `isAuthenticated` is derived ad-hoc in each component: `token() !== null`.
3. `displayName` is computed by parsing the JWT `id_token` on every render in `WifiPage.tsx`.
4. `getUsernameFromToken()` in `token-utils.ts` re-parses the JWT every time it's called.
5. The `decodeIdTokenPayload` utility is exported and called from multiple places.

This means the JWT is decoded repeatedly, derived state is duplicated across components, and there's no single place that owns "who is the current user."

## Goal

Create a structured auth store (nanostore `map`) that:

- Holds the raw token **and** pre-extracted user fields.
- Exposes `computed` stores for `$isAuthenticated`, `$displayName`, `$username`.
- Is populated once when the token is set (at login/callback or session restore).
- Uses `Option` for fields that may not be present.
- Eliminates the need for components to parse JWTs or call `getUsernameFromToken()`.

## Proposed Schema

```ts
// packages/homelab-frontend/src/lib/auth/state.ts
import { Option } from "effect"
import { computed, map } from "nanostores"

type AuthState = {
  token: Option.Option<TokenResponse>
  username: Option.Option<string>
  displayName: Option.Option<string>
}

export const $auth = map<AuthState>({
  token: Option.none(),
  username: Option.none(),
  displayName: Option.none(),
})

export const $isAuthenticated = computed(
  $auth,
  (state) => Option.isSome(state.token),
)
export const $displayName = computed($auth, (state) => state.displayName)
export const $username = computed($auth, (state) => state.username)
```

## Implementation Plan

### 1. Replace `$token` atom with `$auth` map

File: `packages/homelab-frontend/src/lib/auth/state.ts`

- Use `map<AuthState>` from nanostores.
- On `task()` (session restore), parse the stored token, decode the JWT once, and populate all fields.
- On `onSet`, persist to sessionStorage (same as today) and extract username/displayName from the id_token payload.
- Provide a `setAuth(token: TokenResponse)` helper that decodes and sets all fields atomically.
- Provide a `clearAuth()` helper that resets to all `None`.

### 2. Create computed stores

- `$isAuthenticated = computed($auth, (s) => Option.isSome(s.token))` — replaces ad-hoc `token() !== null` checks.
- `$displayName = computed($auth, (s) => s.displayName)` — replaces JWT parsing in components.
- `$username = computed($auth, (s) => s.username)` — replaces `getUsernameFromToken()`.

### 3. Move JWT decoding into `state.ts`

- `decodeIdTokenPayload` moves into `state.ts` as a private helper (or stays in `token-utils.ts` but is no longer exported).
- Username extraction logic (strip `@domain`) lives in `setAuth`.

### 4. Update consumers

- **`WifiPage.tsx`**: Replace `useStore($token)` with `useStore($auth)` or individual computed stores. Remove `displayName()` derivation and `isAuthenticated()` — use `$isAuthenticated` and `$displayName` directly.
- **`effects.ts`**: Replace `$token.get()` with reading from `$auth`. The `id_token` is accessed via `Option.map($auth.get().token, t => t.id_token)`. Replace `getUsernameFromToken()` with `$auth.get().username`.
- **`$wifiParams` integration**: `effectiveUsername` in `WifiPage.tsx` becomes `Option.orElse(params().username, () => $auth.get().username)`.
- **`OAuthCallback.tsx`**: Replace `$token.set(tokenResponse)` with `setAuth(tokenResponse)`.
- **`token-utils.ts`**: Can be deleted entirely (or reduced to just `decodeIdTokenPayload` if needed elsewhere).

### 5. Update exports

File: `packages/homelab-frontend/src/lib/auth/index.ts`

- Export `$auth`, `$isAuthenticated`, `$displayName`, `$username`, `setAuth`, `clearAuth`.
- Deprecate/remove `$token` export.
- Remove `decodeIdTokenPayload` and `getUsernameFromToken` from public API.

## Session Storage Behavior

Same as today:

- On `setAuth`: persist `TokenResponse` JSON + expiry to sessionStorage.
- On `clearAuth`: remove from sessionStorage.
- On page load (`task()`): restore from sessionStorage, decode JWT, populate all fields.
- Expired tokens are cleared on restore (existing logic).

## Migration Checklist

- [ ] Create `$auth` map with `AuthState` type.
- [ ] Implement `setAuth(token)` and `clearAuth()` helpers.
- [ ] Create `$isAuthenticated`, `$displayName`, `$username` computed stores.
- [ ] Move JWT decode + username extraction into `setAuth`.
- [ ] Update `OAuthCallback.tsx` to use `setAuth`.
- [ ] Update `WifiPage.tsx` to use computed stores.
- [ ] Update `effects.ts` to read from `$auth`.
- [ ] Remove `getUsernameFromToken` from `token-utils.ts` / delete file.
- [ ] Update `lib/auth/index.ts` exports.
- [ ] Verify build + typecheck pass.
