# WiFi Page: Single-Source Params Store

## Problem

The WifiPage currently has multiple overlapping sources of state:

1. `getQueryParams()` reads URL search params on mount (with a hardcoded `"WPA2"` fallback that conflicts with the intended `"WPA3"` default).
2. `params` signal holds `{ssid, encryption, password, username}`.
3. `usernameOverride` / `passwordOverride` signals act as editable overrides when logged in.
4. The `effects.ts` functions accept individual args rather than a unified params object.

This makes it confusing to reason about which value wins, and changes to the text inputs don't reflect back in the URL (so refreshing loses edits).

## Goal

Create a single nanostore map (`$wifiParams`) that:

- Is the sole source of truth for all wifi endpoint parameters.
- Stays bidirectionally synced with the browser URL query params.
- Is directly consumed by the effects and the UI.

## Schema (derived from `WifiMobileConfigParams`)

```ts
// packages/homelab-frontend/src/lib/wifi/params.ts
import { Option } from "effect"
import { map } from "nanostores"

type WifiParams = {
  ssid: Option.Option<string>
  encryption: Option.Option<"WPA2" | "WPA3">
  password: Option.Option<string>
  username: Option.Option<string>
  disableMACRandomization: Option.Option<boolean>
  enterpriseClientType: Option.Option<"PEAP" | "EAP-TLS">
}

export const $wifiParams = map<WifiParams>({
  ssid: Option.none(),
  encryption: Option.none(),
  password: Option.none(),
  username: Option.none(),
  disableMACRandomization: Option.none(),
  enterpriseClientType: Option.none(),
})
```

All fields are `Option`. Defaults are resolved at effect invocation time, not at the store level.

## Implementation Plan

### 1. Create `$wifiParams` nanostore map

File: `packages/homelab-frontend/src/lib/wifi/params.ts`

- Use `map<WifiParams>` from nanostores.
- On initialization (via `task()`), read `window.location.search` and call `$wifiParams.setKey(...)` for each present query param. Non-empty values become `Option.some(value)`, absent ones remain `Option.none()`.
- Subscribe to the store and push changes back to the URL via `history.replaceState` (no page reload). Only write `Some` values to the URL; `None` values are omitted.

### 2. Key-level updates from UI

The UI text fields call `$wifiParams.setKey(...)` directly:

- Non-empty string input → `$wifiParams.setKey("username", Option.some(value))`
- Cleared field → `$wifiParams.setKey("username", Option.none())`

Using `map` means only the changed key triggers a re-render in components subscribed via `useStore`.

### 3. Update `effects.ts`

- `downloadAppleProfile` and `fetchClaimCheckAndCopyLink` read from `$wifiParams.get()` and resolve defaults at call time:
  - `encryption` → `Option.getOrElse(() => "WPA3")`
  - `username` → `Option.getOrElse(() => getUsernameFromToken())`
  - `disableMACRandomization` → `Option.getOrElse(() => false)`
- They fail with an appropriate error if required fields (`ssid`, `password`, effective username) are `None` at call time.

### 4. Simplify `WifiPage.tsx`

- Remove `params`, `usernameOverride`, `passwordOverride` signals.
- Replace with `const params = useStore($wifiParams)`.
- Text field `onChange` handlers call `$wifiParams.setKey(...)`.
- `canDownload` derives from the store: `Option.isSome(params.ssid) && Option.isSome(params.password) && (Option.isSome(params.username) || getUsernameFromToken())`.
- Delete `getQueryParams()` entirely.

### 5. Update `WifiPageView` props

The view becomes simpler — it receives the unified params plus callbacks. The `usernameOverride` / `passwordOverride` distinction disappears; there's just `username` and `password` (rendered via `Option.getOrElse(() => "")` for the input value).

## URL Sync Behavior

- On page load: URL → store (one-time parse via `task()`).
- On store change: store → URL (`replaceState`, immediate).
- `None` values are omitted from the URL.
- All defaults live in the effects, not in the store or the URL parsing.

## Migration Checklist

- [x] Create `params.ts` with `$wifiParams`, URL sync logic.
- [x] Update `effects.ts` to read from `$wifiParams` and resolve defaults at invocation.
- [x] Update `WifiPage.tsx` to use `$wifiParams` as sole state source.
- [x] Update `WifiPageView.tsx` props to reflect simplified interface.
- [x] Remove `getQueryParams()` and the separate override signals.
- [x] Export `$wifiParams` from `lib/wifi/index.ts`.
- [x] Verify build passes and dist contains correct defaults.

---

## Phase 2: Setup View (SSID + Encryption Selection)

### Problem

When `ssid` or `encryption` are `None` in `$wifiParams`, the user currently sees a dead-end error screen. Instead, we should present a setup form that lets them provide these values before proceeding.

### Behavior

- If both `ssid` and `encryption` are `Some` on load (from URL query params), skip this view entirely and show the normal `WifiPageView`.
- If either is `None`, show the setup view with:
  - A text field for SSID (prefilled from `$wifiParams` if `Some`).
  - A Kobalte `Select` component for encryption with options `["WPA2", "WPA3"]` (prefilled from `$wifiParams` if `Some`).
  - A "Continue" button that sets the keys on `$wifiParams` and transitions to the main view.
- The setup view calls `$wifiParams.setKey(...)` directly — no local state duplication.
- The "Continue" button is disabled until both SSID (non-empty) and encryption are selected.
- Once confirmed, the `onSet` handler syncs to the URL, so a refresh will skip the setup view.

### Implementation Plan

#### 1. Create `WifiSetupView` component

File: `packages/homelab-frontend/src/components/WifiPage/WifiSetupView.tsx`

- Props:
  - `ssid: Option.Option<string>` — current value from store
  - `encryption: Option.Option<"WPA2" | "WPA3">` — current value from store
  - `onSsidChange: (value: string) => void` — calls `$wifiParams.setKey("ssid", ...)`
  - `onEncryptionChange: (value: "WPA2" | "WPA3") => void` — calls `$wifiParams.setKey("encryption", ...)`
  - `onConfirm: () => void`
  - `canConfirm: boolean`
- Uses `TextField` from Kobalte for SSID input.
- Uses `Select` from `@kobalte/core/select` for encryption dropdown.
- Renders input values from the Options via `Option.getOrElse(..., () => "")`.

#### 2. Update `WifiPage.tsx` gating logic

- Replace the `MissingParams` error screen with `WifiSetupView`.
- Add a `confirmed` signal (boolean, starts `false`).
- If `Option.isSome(ssid) && Option.isSome(encryption)` on initial load, set `confirmed = true` immediately.
- The "Continue" callback sets `confirmed = true`.
- Show `WifiPageView` when `confirmed` is true, `WifiSetupView` otherwise.

#### 3. Checklist

- [ ] Create `WifiSetupView.tsx` with TextField + Select + Continue button.
- [ ] Update `WifiPage.tsx` to gate between setup and main view using a `confirmed` signal.
- [ ] Style the setup view (reuse existing `wifi-page__` CSS classes where possible).
- [ ] Verify build passes.
