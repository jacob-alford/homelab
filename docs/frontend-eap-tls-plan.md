# Frontend EAP-TLS Support Plan

## Summary

Replace manual ID token parsing with a `/status/self` API call after login, and use the returned `isTailscale` flag to conditionally offer EAP-TLS as an authentication method in the Wifi profile download flow.

---

## Current State

- **Auth state** (`lib/auth/state.ts`): After OIDC login, the ID token is manually decoded (`atob` + JSON.parse) to extract `username` and `displayName`.
- **Wifi effects** (`lib/wifi/effects.ts`): The `downloadAppleProfile` and `fetchClaimCheckAndCopyLink` effects always send a PEAP payload (username + password) or Personal payload. There is no EAP-TLS path.
- **AppleTab**: Shows username + password fields when authenticated. Download/copy buttons use the PEAP payload.

## `/status/self` Response Schema

```typescript
// packages/homelab-services/src/schemas/status-self.ts
{
  isTailscale: boolean
  permissions: HashSet<ScopeOrGroup> // (ScopeGroupSetSchema)
  principal: string // e.g. "jacob@example.com"
  fullname: Option<string> // display name
}
```

### Data Gap Analysis

The `/status/self` endpoint already returns everything we need:

| Currently extracted from ID token | Available from `/status/self`                                |
| --------------------------------- | ------------------------------------------------------------ |
| `username` (email prefix)         | `principal` (full email) — we can extract prefix client-side |
| `displayName`                     | `fullname` (Option\<string\>)                                |
| _(not available)_                 | `isTailscale` ✅ NEW                                         |
| _(not available)_                 | `permissions` ✅ NEW                                         |

**No additional fields are needed from the endpoint.**

---

## Implementation Plan

### Step 1: Add a `/status/self` effect in the frontend

**File:** `packages/homelab-frontend/src/lib/auth/effects.ts`

Add a new `fetchSelf` effect that:

1. Takes the auth token (id_token from the token response)
2. Calls `client.status.self({ headers: { authorization: ... } })`
3. Returns the `StatusSelfResponse`

### Step 2: Update auth state to use `/status/self`

**File:** `packages/homelab-frontend/src/lib/auth/state.ts`

Changes:

- Add `isTailscale: boolean` to `AuthState` (default `false`)
- Add `permissions: Option.Option<Set<string>>` to `AuthState` (optional, for future gating)
- After `setAuth(token)` is called, run `fetchSelf` as a follow-up effect to populate `isTailscale`, `username`, and `displayName` from the server response instead of manual token decoding.
- Keep the manual token decode as a **synchronous fallback** (for session restore when the server may be unreachable), but prefer server values when available.
- Export a new computed store: `$isTailscale`

### Step 3: Add `enterpriseClientType` to wifi state

**File:** `packages/homelab-frontend/src/lib/wifi/state.ts`

- Add `enterpriseClientType: Option.Option<"PEAP" | "EAP-TLS">` to `WifiParams`
- Default: `Option.none()` (the container will resolve this based on UI selection)

**File:** `packages/homelab-frontend/src/lib/state.ts`

- Add `enterpriseClientType` to `AppParams` (not persisted to URL — this is session-only, derived from the Select UI)
- Actually: **do NOT persist to URL.** The selection should default to PEAP and only appear when tailscale+authenticated, so it's ephemeral container state — use a SolidJS signal in `WifiPage.tsx` instead.

### Step 4: Add Kobalte Select for auth method in WifiPageView

**File:** `packages/homelab-frontend/src/components/WifiPage/WifiPageView.tsx`

- Add a new prop: `enterpriseClientType: "PEAP" | "EAP-TLS"`
- Add a new prop: `isTailscale: boolean`
- Add a new prop: `onEnterpriseClientTypeChange: (value: "PEAP" | "EAP-TLS") => void`
- Render a Kobalte `Select` at the top of the view, visible only when `props.isAuthenticated && props.isTailscale`
- Options: `["PEAP", "EAP-TLS"]`
- Default value: `"PEAP"`

### Step 5: Update AppleTab for EAP-TLS mode

**File:** `packages/homelab-frontend/src/components/WifiPage/AppleTab.tsx`

- Add prop: `enterpriseClientType: "PEAP" | "EAP-TLS"`
- When `enterpriseClientType === "EAP-TLS"`:
  - **Hide** the username and password override fields (EAP-TLS uses certificates, no user/pass needed)
  - Download button still works but sends EAP-TLS payload
  - Update the description text to explain certificate-based authentication

### Step 6: Update wifi effects for EAP-TLS payload

**File:** `packages/homelab-frontend/src/lib/wifi/effects.ts`

- `downloadAppleProfile`: Accept a new `enterpriseClientType` arg. When `"EAP-TLS"`, send payload `{ enterpriseClientType: "EAP-TLS", disableMACRandomization }` (no username/password).
- `fetchClaimCheckAndCopyLink`: Same — when EAP-TLS, set `enterpriseClientType=EAP-TLS` in the link params and omit username/password.
- The API already accepts `WifiMobileConfigParamsEnterpriseEAPTLS` which only needs `enterpriseClientType: "EAP-TLS"` and `disableMACRandomization`.

### Step 7: Wire it together in WifiPage container

**File:** `packages/homelab-frontend/src/components/WifiPage/WifiPage.tsx`

- Import `$isTailscale` from auth state
- Add a local signal: `const [enterpriseClientType, setEnterpriseClientType] = createSignal<"PEAP" | "EAP-TLS">("PEAP")`
- Pass `isTailscale`, `enterpriseClientType()`, and `onEnterpriseClientTypeChange` to WifiPageView
- Pass `enterpriseClientType()` to AppleTab via WifiPageView
- Update `handleDownload` and `handleCopyDownloadLink` to include `enterpriseClientType()` in the effect args
- When `enterpriseClientType === "EAP-TLS"`:
  - `canDownload` should be `true` (no password required)
  - `validateFields` should skip password check

---

## Component Prop Flow

```
WifiPage (container)
├── signal: enterpriseClientType
├── store: $isTailscale, $isAuthenticated
│
└── WifiPageView (view)
    ├── props: isTailscale, enterpriseClientType, onEnterpriseClientTypeChange
    ├── Kobalte Select (shown when isAuthenticated && isTailscale)
    │
    └── AppleTab (view)
        ├── props: enterpriseClientType
        ├── hides username/password fields when EAP-TLS
        └── download/copy buttons (payload varies by type)
```

---

## Visibility Rules for the Select

| Authenticated | isTailscale | Select Visible | Default Value       |
| ------------- | ----------- | -------------- | ------------------- |
| ❌            | *           | ❌             | N/A (PEAP behavior) |
| ✅            | ❌          | ❌             | N/A (PEAP behavior) |
| ✅            | ✅          | ✅             | PEAP                |

---

## Files Modified

| File                                   | Change                                                                      |
| -------------------------------------- | --------------------------------------------------------------------------- |
| `lib/auth/effects.ts`                  | Add `fetchSelf` effect                                                      |
| `lib/auth/state.ts`                    | Add `isTailscale` to state, export `$isTailscale`, call `fetchSelf` on auth |
| `lib/wifi/effects.ts`                  | Handle `enterpriseClientType` arg in download/copy effects                  |
| `lib/state.ts`                         | No change (enterpriseClientType is ephemeral container state)               |
| `components/WifiPage/WifiPage.tsx`     | Add signal, wire new props, update handlers                                 |
| `components/WifiPage/WifiPageView.tsx` | Add Select component, new props                                             |
| `components/WifiPage/AppleTab.tsx`     | Conditionally hide fields for EAP-TLS                                       |
| `components/WifiPage/WifiPage.css`     | Styles for the Select (reuse existing `wifi-page__select-*` classes)        |

---

## Edge Cases

1. **Session restore without network**: Keep the existing manual ID token decode as fallback for username/displayName. `isTailscale` defaults to `false` if `fetchSelf` fails (safe default — hides the Select).
2. **Token expired before fetchSelf**: If the call fails with 401, clear auth state (existing behavior).
3. **User switches from EAP-TLS back to PEAP**: The signal resets; username/password fields reappear with their previous Option values from the store.
4. **Guest user on tailscale**: If `Status_Self` permission isn't in guest permissions, the call will 403. Treat this same as non-tailscale (hide Select). Alternatively, ensure guests have `Status_Self.view` — check if this is desired.

---

## Out of Scope

- Android tab EAP-TLS support (separate task)
- DNS page changes
- Backend changes (EAP-TLS handler already implemented)
- WifiSetupView changes (the setup view collects password which is still needed for PEAP; EAP-TLS selection happens after setup)
