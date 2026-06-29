# Ethernet Profile Frontend Plan

## Summary

When an enterprise authentication method (PEAP or EAP-TLS) is selected and the user is logged in, show a switch labeled "Include ethernet profile" above the Apple download button. Pass the value as a URL param in both the direct download API call and the copy-link URL.

---

## Current State

- **WifiPage container** (`WifiPage.tsx`): Manages wifi state, calls download/copy-link effects.
- **AppleTab view** (`AppleTab.tsx`): Renders username/password fields for PEAP, download and copy-link buttons.
- **Wifi effects** (`lib/wifi/effects.ts`): `downloadAppleProfile` and `fetchClaimCheckAndCopyLink` build payloads and call the API client.
- **App state** (`lib/state.ts`): Unified `AppParams` store with URL sync. Params include `ssid`, `encryption`, `password`, `username`, `disableMACRandomization`, etc.
- **DNS AppleTab** (`DnsPage/AppleTab.tsx`): Contains the switch UI pattern to replicate — uses Kobalte `Switch` with classes `dns-page__switch`, `dns-page__switch-control`, `dns-page__switch-thumb`, `dns-page__switch-label`.

---

## Implementation Plan

### Step 1: Add `includeEthernetProfile` to App State

**File:** `packages/homelab-frontend/src/lib/state.ts`

1. Add to `AppParams`:
   ```typescript
   includeEthernetProfile: Option.Option<boolean>
   ```

2. Read from URL in `readURL()`:
   ```typescript
   const includeEthernetProfile = params.get("includeEthernetProfile")
   // ...
   includeEthernetProfile: Option.fromNullable(
     includeEthernetProfile === "true"
       ? true
       : includeEthernetProfile === "false"
       ? false
       : null,
   )
   ```

3. Add to `syncURL` and `buildQueryString`:
   ```typescript
   includeEthernetProfile: Option.map(p.includeEthernetProfile, String),
   ```

4. Add setter to `useAppParams`:
   ```typescript
   setIncludeEthernetProfile: (v: Option.Option<boolean>) => update({ includeEthernetProfile: v }),
   ```

### Step 2: Expose in Wifi State

**File:** `packages/homelab-frontend/src/lib/wifi/state.ts`

1. Add `includeEthernetProfile: Option.Option<boolean>` to `WifiParams`.
2. Include in `wifiParams()` accessor.
3. Expose `setIncludeEthernetProfile` from the returned object.

### Step 3: Update Wifi Effects

**File:** `packages/homelab-frontend/src/lib/wifi/effects.ts`

Both `downloadAppleProfile` and `fetchClaimCheckAndCopyLink`:

1. Add `includeEthernetProfile: Option.Option<boolean>` to the args type.
2. When building the payload for PEAP and EAP-TLS, include `includeEthernetProfile`:
   ```typescript
   if (args.enterpriseClientType === "EAP-TLS") {
     const includeEthernetProfile = Option.getOrElse(
       args.includeEthernetProfile,
       () => false,
     )
     payload = {
       enterpriseClientType: "EAP-TLS",
       disableMACRandomization,
       includeEthernetProfile,
     }
   } else if (args.enterpriseClientType === "PEAP") {
     const includeEthernetProfile = Option.getOrElse(
       args.includeEthernetProfile,
       () => false,
     )
     payload = {
       username,
       password,
       disableMACRandomization,
       enterpriseClientType: "PEAP",
       includeEthernetProfile,
     }
   }
   ```
3. In `fetchClaimCheckAndCopyLink`, add to `linkParams`:
   ```typescript
   if (includeEthernetProfile) {
     linkParams.set("includeEthernetProfile", "true")
   }
   ```

### Step 4: Update AppleTab Props & View

**File:** `packages/homelab-frontend/src/components/WifiPage/AppleTab.tsx`

1. Add to `AppleTabProps`:
   ```typescript
   includeEthernetProfile: boolean
   onIncludeEthernetProfileChange: (value: boolean) => void
   showEthernetSwitch: boolean
   ```

2. Add a switch (same pattern as DNS page) above the download actions, conditionally shown when `props.showEthernetSwitch` is true:
   ```tsx
   <Show when={props.showEthernetSwitch}>
     <div class="wifi-page__switches">
       <div class="wifi-page__switch-group">
         <Switch
           class="wifi-page__switch"
           checked={props.includeEthernetProfile}
           onChange={props.onIncludeEthernetProfileChange}
         >
           <Switch.Input class="wifi-page__switch-input" />
           <Switch.Control class="wifi-page__switch-control">
             <Switch.Thumb class="wifi-page__switch-thumb" />
           </Switch.Control>
           <Switch.Label class="wifi-page__switch-label">
             Include ethernet profile
           </Switch.Label>
         </Switch>
       </div>
     </div>
   </Show>
   ```

3. Add switch CSS classes to `WifiPage.css` matching the DNS page's switch styling (spacing, sizing).

### Step 5: Wire Through WifiPageView

**File:** `packages/homelab-frontend/src/components/WifiPage/WifiPageView.tsx`

1. Add to `WifiPageViewProps`:
   ```typescript
   includeEthernetProfile: boolean
   onIncludeEthernetProfileChange: (value: boolean) => void
   showEthernetSwitch: boolean
   ```

2. Pass to `AppleTab`:
   ```tsx
   <AppleTab
     ...
     includeEthernetProfile={props.includeEthernetProfile}
     onIncludeEthernetProfileChange={props.onIncludeEthernetProfileChange}
     showEthernetSwitch={props.showEthernetSwitch}
   />
   ```

### Step 6: Wire in WifiPage Container

**File:** `packages/homelab-frontend/src/components/WifiPage/WifiPage.tsx`

1. Compute `showEthernetSwitch`:
   ```typescript
   const showEthernetSwitch = () =>
     isAuthenticated()
     && (enterpriseClientType() === "PEAP" ||
       enterpriseClientType() === "EAP-TLS")
   ```
   The switch is only visible when the user is logged in AND an enterprise auth method is selected.

2. Compute `includeEthernetProfile`:
   ```typescript
   const includeEthernetProfile = () =>
     Option.getOrElse(wifiParams().includeEthernetProfile, () => false)
   ```

3. Add handler:
   ```typescript
   function handleIncludeEthernetProfileChange(value: boolean) {
     wifi.setIncludeEthernetProfile(Option.some(value))
   }
   ```

4. Pass to `WifiPageView`:
   ```tsx
   includeEthernetProfile = { includeEthernetProfile() }
   onIncludeEthernetProfileChange = { handleIncludeEthernetProfileChange }
   showEthernetSwitch = { showEthernetSwitch() }
   ```

5. Include `includeEthernetProfile` in `handleDownload` and `handleCopyDownloadLink` calls:
   ```typescript
   Lib.Wifi.Effects.downloadAppleProfile({
     ...existing,
     includeEthernetProfile: wifiParams().includeEthernetProfile,
   })
   ```

---

## CSS

Add switch styles to `WifiPage.css` mirroring the DNS page's switch layout. Use the same class naming pattern but with `wifi-page__` prefix:

```css
.wifi-page__switches {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.wifi-page__switch-group {
  /* same as dns-page__switch-group */
}
.wifi-page__switch {
  /* same as dns-page__switch */
}
.wifi-page__switch-input {
  /* same as dns-page__switch-input */
}
.wifi-page__switch-control {
  /* same as dns-page__switch-control */
}
.wifi-page__switch-thumb {
  /* same as dns-page__switch-thumb */
}
.wifi-page__switch-label {
  /* same as dns-page__switch-label */
}
```

---

## Validation Steps

Run from repo root in order:

```sh
dprint fmt .
yarn lint --fix
yarn lint
yarn typecheck
yarn test
```

If any step fails, target the frontend package:

```sh
yarn workspace homelab-frontend typecheck
yarn workspace homelab-frontend lint --fix
```

E2E tests (server must be running):

```sh
yarn workspace homelab-e2e-tests test
```

---

## Checklist

- [ ] `includeEthernetProfile` added to `AppParams` in `lib/state.ts`
- [ ] URL read/sync/queryString updated for new param
- [ ] `setIncludeEthernetProfile` setter added
- [ ] `WifiParams` and `useWifiParams` updated in `lib/wifi/state.ts`
- [ ] `downloadAppleProfile` effect sends `includeEthernetProfile` in payload
- [ ] `fetchClaimCheckAndCopyLink` effect includes param in link URL
- [ ] `AppleTab` shows switch when authenticated + enterprise auth selected
- [ ] Switch defaults to `false`
- [ ] Switch hidden when not authenticated or personal wifi selected
- [ ] Switch CSS matches DNS page spacing/style
- [ ] All typechecks pass
- [ ] All lint passes
- [ ] All unit tests pass
- [ ] E2E tests pass
