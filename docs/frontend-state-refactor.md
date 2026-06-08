# Frontend State Refactor: Nanostores → SolidJS Hooks for URL Params

## Goal

Replace the nanostore-based `$params` / `$wifiParams` / `$dnsParams` URL-synced stores with SolidJS hooks wrapping `useSearchParams`. Auth state (session-storage-backed, not URL-driven) stays as-is with nanostores.

## Why

- Eliminates custom `onSet` + `history.replaceState` sync machinery
- Hooks are idiomatic SolidJS for URL-driven state
- Effects currently call `$params.get()` inline — after refactor they receive params as arguments (pure, testable, no hidden dependencies)
- Removes `reinitFromURL()` / `astro:page-load` re-sync workaround

## What Changes

| Area                  | Before                                                       | After                                                     |
| --------------------- | ------------------------------------------------------------ | --------------------------------------------------------- |
| `lib/state.ts`        | `$params` nanostore + `onSet` sync + `$queryString` computed | `useAppParams()` hook backed by `useSearchParams`         |
| `lib/wifi/state.ts`   | `$wifiParams` computed store                                 | `useWifiParams()` hook                                    |
| `lib/dns/state.ts`    | `$dnsParams` computed store + helpers                        | `useDnsParams()` hook                                     |
| `lib/wifi/effects.ts` | Calls `$params.get()` / `Auth.State.$auth.get()` inline      | Accepts `Option` params as arguments, resolves internally |
| `lib/dns/effects.ts`  | Calls `$params.get()` / `Auth.State.$auth.get()` inline      | Accepts `Option` params as arguments, resolves internally |
| `lib/auth/state.ts`   | Nanostore + sessionStorage sync                              | **No change**                                             |
| Container components  | `useStore($wifiParams)`, `$params.setKey(...)`               | Call domain hooks, pass Options directly to effects       |
| View components       | No change                                                    | No change                                                 |

## What Stays the Same

- `lib/auth/state.ts` — nanostore + sessionStorage persistence
- `lib/auth/effects.ts` — already clean
- View components — props-only
- `lib/runtime.ts`, `lib/env.ts`, `lib/Loadable.ts`

## Hook Design

### `lib/state.ts` — `useAppParams()`

```typescript
import { useSearchParams } from "@solidjs/router"
import { Option } from "effect"

export type Tab = "apple" | "android"

export function useAppParams() {
  const [searchParams, setSearchParams] = useSearchParams()

  const tab = (): Tab => /* derive from localStorage */
  const ssid = () => Option.fromNullable(searchParams.ssid || null)
  const encryption = () => /* ... */
  // ... all fields as accessors returning Option<T>

  const setTab = (t: Tab) => { /* localStorage */ }
  const setSSID = (v: string) => { setSearchParams({ ssid: v }) }
  // ... setters

  return { tab, ssid, encryption, password, username, disableMACRandomization, blockAds, tailscale, keepLogs, setTab, setSSID, /* ... */ }
}
```

### `lib/wifi/state.ts` — `useWifiParams()`

```typescript
import { useAppParams } from "../state.js"

export function useWifiParams() {
  const params = useAppParams()
  return {
    ssid: params.ssid,
    encryption: params.encryption,
    password: params.password,
    username: params.username,
    disableMACRandomization: params.disableMACRandomization,
    setSSID: params.setSSID,
    setEncryption: params.setEncryption,
    setPassword: params.setPassword,
    setUsername: params.setUsername,
    setDisableMACRandomization: params.setDisableMACRandomization,
    tab: params.tab,
    setTab: params.setTab,
  }
}
```

### `lib/dns/state.ts` — `useDnsParams()`

```typescript
import { useAppParams } from "../state.js"

export function useDnsParams() {
  const params = useAppParams()
  return {
    blockAds: params.blockAds,
    tailscale: params.tailscale,
    keepLogs: params.keepLogs,
    setBlockAds: params.setBlockAds,
    setTailscale: params.setTailscale,
    setKeepLogs: params.setKeepLogs,
    tab: params.tab,
    setTab: params.setTab,
  }
}

// Pure functions — unchanged
export function deriveProfile(...) { /* ... */ }
export function profileFriendlyName(...) { /* ... */ }
```

## Effects Refactor

Effects accept `Option<T>` values directly. Inside the effect body:

- **Required fields**: `yield*` the Option (produces `NoSuchElementException` on `None`)
- **Optional fields with defaults**: `Option.getOrElse(option, () => default)`
- **Legitimately optional fields** (e.g. `token` — guests aren't logged in): keep as Option, handle conditionally
- **Error handling**: `Effect.catchTag("NoSuchElementException", ...)` as a trailing pipe arg to `Effect.fn` converts any missed required None into a user-facing error for the toast

This keeps default resolution and validation co-located in the effect — one place, not scattered across components.

### `lib/wifi/effects.ts`

```typescript
import { Effect, Option } from "effect"
import { ApiErrors } from "homelab-services"

export const downloadAppleProfile = Effect.fn("downloadAppleProfile")(
  function*(args: {
    ssid: Option.Option<string>
    encryption: Option.Option<"WPA2" | "WPA3">
    password: Option.Option<string>
    username: Option.Option<string>
    disableMACRandomization: Option.Option<boolean>
    token: Option.Option<string> // optional — guests won't have one
  }) {
    // Required — yield* fails with NoSuchElementException if None
    const ssid = yield* args.ssid
    const password = yield* args.password

    // Defaults resolved here
    const encryption = Option.getOrElse(args.encryption, () => "WPA3" as const)
    const disableMACRandomization = Option.getOrElse(
      args.disableMACRandomization,
      () => false,
    )

    // Legitimately optional
    const username = Option.getOrUndefined(args.username)
    const token = Option.getOrUndefined(args.token)

    // ... implementation using concrete values
  },
  Effect.catchTag(
    "NoSuchElementException",
    () =>
      Effect.fail(
        new ApiErrors.InternalServerError({
          message: "Missing required parameter",
        }),
      ),
  ),
)
```

### `lib/dns/effects.ts`

Same pattern — Options in, `yield*` for required, `getOrElse` for defaults, `getOrUndefined` for legitimately optional, `catchTag` on the outside.

### Container component call site

```typescript
const wifi = useWifiParams()
const auth = useStore(Lib.Auth.State.$auth)

// Just pass the Options straight through — no unwrapping at call site
Lib.Runtime.runEffect(Lib.Wifi.Effects.downloadAppleProfile({
  ssid: wifi.ssid(),
  encryption: wifi.encryption(),
  password: wifi.password(),
  username: wifi.username(),
  disableMACRandomization: wifi.disableMACRandomization(),
  token: Option.map(auth().token, (t) => t.access_token),
}))
```

Clean call site — no unwrapping, no empty strings, no defaults. The effect owns its own validation and defaults.

## Navigation Hrefs

`useAppParams()` exposes a `queryString()` accessor derived from `searchParams` directly. Since `useSearchParams` is reactive, nav links update automatically.

## Migration Steps

1. Add `@solidjs/router` — wrap SolidJS islands in `<Router>`
2. Rewrite `lib/state.ts` — `useAppParams()` hook
3. Rewrite `lib/wifi/state.ts` — `useWifiParams()` hook
4. Rewrite `lib/dns/state.ts` — `useDnsParams()` hook
5. Refactor `lib/wifi/effects.ts` — accept Options, resolve internally, add `catchTag`
6. Refactor `lib/dns/effects.ts` — same
7. Update container components — call hooks, pass Options to effects
8. Remove dead code — `onSet`, `syncURL`, `reinitFromURL`, `$queryString`, `astro:page-load`
9. Verify — `yarn typecheck && yarn test`

## Open Questions

- **Tab state**: Keep in localStorage only, or also put in URL?
- **`@solidjs/router` in Astro**: Need to confirm `useSearchParams` works with Astro's routing. If not, write a thin custom hook over `window.location.search` + `history.replaceState` (same mechanics as today but as a hook).

## File Checklist

- [ ] `lib/state.ts` — rewrite
- [ ] `lib/wifi/state.ts` — rewrite
- [ ] `lib/dns/state.ts` — rewrite
- [ ] `lib/wifi/effects.ts` — refactor signatures + add catchTag
- [ ] `lib/dns/effects.ts` — refactor signatures + add catchTag
- [ ] Container components (WifiPage, DnsPage, NavBarContainer) — update
- [ ] `lib/auth/state.ts` — no change
- [ ] `lib/auth/effects.ts` — no change
- [ ] Remove `@nanostores/solid` usage for params (keep for auth)
- [ ] Verify router/provider setup for `useSearchParams` (or implement custom hook)
