# DNS Configuration Profiles Frontend - Implementation Plan

## Overview

Add a DNS configuration page with Apple/Android tabs, toggle switches for profile selection, download/copy buttons, a shared navigation bar with logo and page links, and a "Configure DNS →" link on the Wifi page.

---

## Task 1: Shared Navigation Bar

Currently the topbar is inlined in `WifiPageView`. We need a shared nav component with the logo and page links.

**Files:**

- **Create** `src/components/NavBar/NavBar.tsx` — Pure view component
- **Create** `src/components/NavBar/NavBar.css` — Styling
- **Create** `src/components/NavBar/index.ts` — Barrel export

**NavBar behavior:**

- Logo (`/logo.png`) on the left
- Links: "Wifi" (`/`), "DNS" (`/dns`)
- Active link gets a thick bottom border (underscore)
- Links don't change color when visited (`:visited` same as default)
- Login/Logout section on the right (same pattern as current topbar)

**Props interface:**

```typescript
interface NavBarProps {
  currentPath: string // "/", "/dns" — used to highlight active link
  mounted: boolean
  oidcEnabled: boolean
  isAuthenticated: boolean
  displayName: Option.Option<string>
  onLogin: () => void
  onLogout: () => void
}
```

**Update** `WifiPageView.tsx` — Replace inline `<nav>` with `<NavBar currentPath="/" ... />`
**Update** `WifiPage.tsx` — Pass nav-related props through

---

## Task 2: Dynamic Page Title

**Pattern:** `Homelab | :page | :params`

- **Wi-Fi page:** `Homelab | Wi-Fi | :username` where `:username` is the username from the wifi nanostore (omit the `| :params` segment if username is None)
- **DNS page:** `Homelab | DNS | :friendlyProfile` where `:friendlyProfile` is a human-readable name derived from the current profile selection (e.g. "Private", "Private + Tailscale", "Monitoring + Tailscale", "Resolver Only")

**Implementation:**

- Use `document.title` reactively in each page's container component (set on mount and when relevant store values change)
- Use a SolidJS `createEffect` to keep the title in sync with store state

**Friendly profile names:**

| DnsProfile                      | Friendly Name          |
| ------------------------------- | ---------------------- |
| `private_homelab`               | Private                |
| `private_homelab_resolver_only` | Resolver Only          |
| `private_tailscale`             | Private + Tailscale    |
| `monitoring_tailscale`          | Monitoring + Tailscale |

---

## Task 3: DNS Page Store & Params

**Files:**

- **Create** `src/lib/dns/params.ts` — Nanostores for DNS page state
- **Create** `src/lib/dns/index.ts` — Barrel export

**State shape:**

```typescript
type DnsTab = "apple" | "android"

type DnsParams = {
  blockAds: Option.Option<boolean> // default: true
  tailscale: Option.Option<boolean> // default: false
  keepLogs: Option.Option<boolean> // default: false
}
```

- `$dnsTab` atom, initialized from URL `?tab=`
- `$dnsParams` map, initialized from URL query params (`?blockAds=true&tailscale=false&keepLogs=false`)
- URL sync via `onSet` + `history.replaceState`
- Uses `Record.getSomes` to filter None values before writing to URL (same pattern as wifi)
- Only non-default values appear in the URL to keep it clean (e.g. `blockAds=true` is the default so it's omitted unless set to false)

**URL param initialization:**

```typescript
function initFromURL(): DnsParams {
  const params = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search)
    : null
  const blockAds = params?.get("blockAds")
  const tailscale = params?.get("tailscale")
  const keepLogs = params?.get("keepLogs")

  return {
    blockAds: Option.fromNullable(
      blockAds === "true" ? true : blockAds === "false" ? false : null,
    ),
    tailscale: Option.fromNullable(
      tailscale === "true" ? true : tailscale === "false" ? false : null,
    ),
    keepLogs: Option.fromNullable(
      keepLogs === "true" ? true : keepLogs === "false" ? false : null,
    ),
  }
}
```

**Effective values** (resolving defaults at point of consumption):

```typescript
// Resolve Option with defaults for use in UI and profile derivation
const effectiveBlockAds = Option.getOrElse(params.blockAds, () => true)
const effectiveTailscale = Option.getOrElse(params.tailscale, () => false)
const effectiveKeepLogs = Option.getOrElse(params.keepLogs, () => false)
```

**Profile derivation** (pure function):

```typescript
function deriveProfile(
  params: { blockAds: boolean; tailscale: boolean; keepLogs: boolean },
): DnsProfile {
  if (params.tailscale && params.keepLogs) return "monitoring_tailscale"
  if (params.tailscale) return "private_tailscale"
  if (!params.blockAds) return "private_homelab_resolver_only"
  return "private_homelab"
}
```

**Derived mapping:**

| blockAds | tailscale | keepLogs | Profile                         |
| -------- | --------- | -------- | ------------------------------- |
| true     | false     | false    | `private_homelab`               |
| false    | false     | false    | `private_homelab_resolver_only` |
| true     | true      | false    | `private_tailscale`             |
| true     | true      | true     | `monitoring_tailscale`          |
| true     | false     | true     | `private_homelab`               |

Note: When tailscale is ON, blockAds is forced true and disabled. The "Keep Logs" switch only appears for logged-in users.

---

## Task 4: DNS Effects

**Files:**

- **Create** `src/lib/dns/effects.ts` — Download and copy-link effects

**Effects:**

1. `downloadDnsProfile` — Reads `$dnsParams`, derives profile, calls `client["mobile-config"].dns(...)` with auth headers if available, triggers blob download as `.mobileconfig`
2. `copyDnsDownloadLink` — Constructs URL to `/mobile-config/dns/{profile}/_download` and copies to clipboard (NO claim-check needed)

---

## Task 5: DNS Page Components

**Files:**

- **Create** `src/components/DnsPage/DnsPage.tsx` — Container
- **Create** `src/components/DnsPage/DnsPageView.tsx` — Main view with tabs
- **Create** `src/components/DnsPage/AppleTab.tsx` — Apple tab with switches + download + copy
- **Create** `src/components/DnsPage/AndroidTab.tsx` — Android instructions
- **Create** `src/components/DnsPage/DnsPage.css` — Styling
- **Create** `src/components/DnsPage/index.ts` — Barrel export

**DnsPage (container):**

- Subscribes to: `$isAuthenticated`, `$displayName`, `$dnsParams`, `$dnsTab`
- Resolves effective values from Options with defaults
- Handlers: `handleDownload`, `handleCopyLink`, `handleTabChange`, switch toggles (write `Option.some(value)` to store via `$dnsParams.setKey`)
- Sets `document.title` reactively via `createEffect` based on derived profile friendly name
- Runs effects via `runEffect(...)` with toast notifications

**DnsPageView props:**

```typescript
interface DnsPageViewProps {
  mounted: boolean
  oidcEnabled: boolean
  isAuthenticated: boolean
  displayName: Option.Option<string>
  blockAds: boolean
  tailscale: boolean
  keepLogs: boolean
  tab: DnsTab
  copyingLink: boolean
  onTabChange: (tab: DnsTab) => void
  onBlockAdsChange: (value: boolean) => void
  onTailscaleChange: (value: boolean) => void
  onKeepLogsChange: (value: boolean) => void
  onDownload: () => void
  onCopyDownloadLink: () => void
  onLogin: () => void
  onLogout: () => void
}
```

**AppleTab content:**

- Title: "DNS Configuration"
- Description: "Installs a DNS profile to your device with tracker and ad blocking."
- Switches:
  - "Block Trackers and Ads" — always visible, default true, disabled when tailscale is on
    - When disabled: subtext "always enabled over tailscale"
  - "Tailscale" — only shown when authenticated, default false
  - "Keep Logs" — only shown when authenticated, default false
- Download button (same style as wifi)
- Copy Download Link button (same style as wifi, no spinner/claim-check complexity)

**AndroidTab content:**

- Title: "Private DNS"
- Subtitle: "Android 9 or higher"
- Steps:
  1. Go to Settings → Network & internet → Advanced → Private DNS.
  2. Select the Private DNS provider hostname option.
  3. Enter `ae8918.dns.nextdns.io` and hit Save.

---

## Task 6: DNS Astro Page

**Files:**

- **Create** `src/pages/dns.astro`

```astro
---
import { DnsPage } from "../components/DnsPage/index"
import Layout from "../layouts/Layout.astro"
---
<Layout>
  <DnsPage client:only="solid-js" />
</Layout>
```

**Update** `src/layouts/Layout.astro` — Set base title to "Homelab" (each page container sets `document.title` dynamically on the client)

---

## Task 7: "Configure DNS →" Link on Wifi Page

**Files:**

- **Update** `src/components/WifiPage/WifiPageView.tsx` — Add a link at the bottom-right after the tabs content
- **Update** `src/components/WifiPage/WifiPage.css` — Style for the configure DNS link

**Implementation:**

- Use `FaSolidCircleArrowRight` icon (matching the `FaSolidCircleArrowLeft` used for "Adjust parameters")
- Link text: "Configure DNS" with right-arrow icon
- Positioned bottom-right of the wifi view
- Links to `/dns`

---

## Task 8: Kobalte Switch Styling

**Files:**

- **Update** `src/styles/components.css` — Add Switch component styles (if not already present)

The switches use `@kobalte/core/switch` with custom styling matching the design token system. Each switch will have:

- A label
- Optional subtext (for the "always enabled over tailscale" message)
- Disabled state styling

---

## File Creation Order (dependency order)

1. `src/lib/dns/params.ts` + `src/lib/dns/effects.ts` + `src/lib/dns/index.ts`
2. `src/components/NavBar/NavBar.tsx` + `NavBar.css` + `index.ts`
3. `src/components/DnsPage/AppleTab.tsx` + `AndroidTab.tsx`
4. `src/components/DnsPage/DnsPageView.tsx` + `DnsPage.tsx` + `DnsPage.css` + `index.ts`
5. `src/pages/dns.astro`
6. Update `WifiPageView.tsx` + `WifiPage.tsx` — Replace inline nav with `NavBar`, add "Configure DNS →", add dynamic title
7. Update `Layout.astro` — Base title "Homelab"
8. Update `WifiPage.css` — Add configure-dns link styles
9. Update `components.css` — Add Switch styles if needed

---

## Key Design Decisions

1. **NavBar is a shared view component** — Receives `currentPath` as prop; each page's container provides it. No client-side routing needed; Astro handles page navigation.

2. **Dynamic page title** — Each container sets `document.title` reactively via `createEffect`. Wi-Fi uses username from store; DNS uses a friendly name derived from the profile. Format: `Homelab | :page | :params` (`:params` segment omitted when value is absent).

3. **Switch state synced to URL query params** — Same pattern as wifi: `$dnsParams` is a nanostore `map` with `Option<boolean>` values initialized from URL at creation time. `onSet` handlers sync back to URL via `history.replaceState` + `Record.getSomes`. Only non-default values appear in the URL. This makes profiles bookmarkable.

4. **Profile derivation is a pure function** — Lives in `lib/dns/params.ts`. Takes resolved effective booleans, returns one of the four `DnsProfile` literal values.

5. **No auth required for copy link** — Unlike wifi, the DNS copy link simply constructs the URL to the `_download` endpoint. No claim-check POST needed.

6. **Switch state drives profile selection** — The three booleans map deterministically to one of the four `DnsProfile` literal values.

7. **Tailscale forces blockAds** — When tailscale switch is toggled on, `blockAds` is set to true in the store and the switch is rendered as disabled with subtext.

8. **Reuse `runEffect` from wifi** — The runtime layer is generic (provides `FetchHttpClient` + `SessionStorageService`); DNS effects use the same runner.

9. **CSS follows existing BEM convention** — `dns-page__` prefix for all DNS page classes, same design tokens.
