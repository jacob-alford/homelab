# View Transitions & NavBar Extraction Plan

## Overview

Adopt Astro's `<ClientRouter />` for SPA-mode view transitions with the `slide` animation. Extract the NavBar from individual SolidJS page components into the Astro `Layout.astro` component, using `transition:persist` to preserve its state (auth, mounted) across navigations.

---

## Current State

- **Layout.astro** — Minimal shell: `<head>` + `<body><slot /></body>`. No NavBar.
- **NavBar** — A SolidJS component rendered inside each page's view component (`WifiPageView`, `DnsPageView`). Each page passes auth/login/logout props through.
- **Pages** — `index.astro` and `dns.astro` render `<WifiPage client:only="solid-js" />` and `<DnsPage client:only="solid-js" />` inside `<Layout>`. Full-page MPA navigation between them.
- **Astro version** — `^6.4.2` with `@astrojs/solid-js` integration.

---

## Goals

1. Enable `<ClientRouter />` for smooth client-side navigations (SPA mode).
2. Use the `slide` built-in animation for page content transitions.
3. Extract NavBar into an Astro-level component with `transition:persist` so it stays alive across navigations (no re-mount, no flash, auth state preserved).
4. Remove NavBar rendering and related props from `WifiPageView`/`DnsPageView`/`WifiPage`/`DnsPage`.

---

## Implementation Steps

### Step 1: Add `<ClientRouter />` to Layout

Update `Layout.astro` to import and include `<ClientRouter />` in `<head>`:

```astro
---
import { ClientRouter } from "astro:transitions"
import "../styles/global.css"
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- existing meta/link/title tags -->
    <ClientRouter />
  </head>
  <body>
    <slot />
  </body>
</html>
```

### Step 2: Apply `slide` animation to page content

Set `transition:animate="none"` on `<html>` to disable the default fade, then apply `transition:animate="slide"` on the `<slot />` wrapper (a `<main>` element):

```astro
<html lang="en" transition:animate="none">
  <head>...</head>
  <body>
    <nav transition:persist="navbar">
      <!-- NavBar here -->
    </nav>
    <main transition:animate="slide">
      <slot />
    </main>
  </body>
</html>
```

### Step 3: Create `NavBar.astro` wrapper

Create `src/components/NavBar/NavBarIsland.astro` — a thin Astro wrapper that renders the SolidJS NavBar with `client:only="solid-js"` and wires it to the `transition:persist` directive:

```astro
---
// NavBarIsland.astro
import { NavBarContainer } from "./NavBarContainer"
---

<div transition:persist="navbar" transition:persist-props>
  <NavBarContainer client:only="solid-js" />
</div>
```

Since the NavBar needs to know the current path and subscribe to auth stores, we'll create a new `NavBarContainer.tsx` SolidJS component that:

- Reads `currentPath` from `window.location.pathname` (reactive on `astro:page-load`)
- Subscribes to auth nanostores (`$isAuthenticated`, `$displayName`)
- Renders the existing `NavBar` view component

### Step 4: Create `NavBarContainer.tsx`

```typescript
// src/components/NavBar/NavBarContainer.tsx
import { useStore } from "@nanostores/solid"
import { createSignal, onMount } from "solid-js"
import {
  $displayName,
  $isAuthenticated,
  clearAuth,
  login,
  oidcEnabled,
} from "../../lib/auth/index.js"
import { runEffect } from "../../lib/wifi/index.js"
import { NavBar } from "./NavBar.js"

export function NavBarContainer() {
  const isAuthenticated = useStore($isAuthenticated)
  const displayName = useStore($displayName)
  const [mounted, setMounted] = createSignal(false)
  const [currentPath, setCurrentPath] = createSignal("/")

  onMount(() => {
    setMounted(true)
    setCurrentPath(window.location.pathname)
    document.addEventListener("astro:page-load", () => {
      setCurrentPath(window.location.pathname)
    })
  })

  function handleLogin() {
    runEffect(login()).catch(() => {})
  }

  return (
    <NavBar
      currentPath={currentPath()}
      mounted={mounted()}
      oidcEnabled={oidcEnabled}
      isAuthenticated={isAuthenticated()}
      displayName={displayName()}
      onLogin={handleLogin}
      onLogout={clearAuth}
    />
  )
}
```

Key detail: because the NavBar is persisted, `onMount` only fires once. The `astro:page-load` event listener updates `currentPath` on each navigation so the active link highlighting stays correct.

### Step 5: Update Layout.astro

```astro
---
import { ClientRouter } from "astro:transitions"
import NavBarIsland from "../components/NavBar/NavBarIsland.astro"
import "../styles/global.css"
---

<!DOCTYPE html>
<html lang="en" transition:animate="none">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="generator" content={Astro.generator} />
    <link
      rel="icon"
      type="image/png"
      href="/favicon-96x96.png?v=20260608"
      sizes="96x96"
    />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=20260608" />
    <link rel="shortcut icon" href="/favicon.ico?v=20260608" />
    <link
      rel="apple-touch-icon"
      sizes="180x180"
      href="/apple-touch-icon.png?v=20260608"
    />
    <meta name="apple-mobile-web-app-title" content="Homelab" />
    <link rel="manifest" href="/site.webmanifest?v=20260608" />
    <title>Homelab</title>
    <ClientRouter />
  </head>
  <body>
    <NavBarIsland />
    <main transition:animate="slide">
      <slot />
    </main>
  </body>
</html>
```

### Step 6: Remove NavBar from page view components

**WifiPageView.tsx:**

- Remove `NavBar` import and rendering
- Remove nav-related props from `WifiPageViewProps` (`mounted`, `oidcEnabled`, `isAuthenticated`, `displayName`, `onLogin`, `onLogout`) — BUT WAIT: these props are still used by the page for gating auth-dependent features (e.g. showing the copy link button). Only remove the NavBar-specific rendering; keep any auth props that the page content itself uses.

Actually, looking at this more carefully: `isAuthenticated`, `displayName`, etc. are used for more than just the NavBar in both pages. The plan is to only remove the `<NavBar ... />` JSX from the view components, and remove props that were _only_ needed for the NavBar. In practice, `onLogin` and `onLogout` may still be needed if there are other login/logout triggers on the page — but currently they are only used by the NavBar. Let's audit:

- `WifiPageView` — uses `mounted` for the setup flow (still needed), `isAuthenticated` for copy-link button visibility (still needed). `onLogin`/`onLogout` are only passed to NavBar → **can remove from view props**.
- `DnsPageView` — uses `isAuthenticated` for Keep Logs switch visibility. `onLogin`/`onLogout` only for NavBar → **can remove from view props**.

**Props to remove from view components:**

- `onLogin`
- `onLogout`
- `oidcEnabled` (only used to conditionally render NavBar login section)

**Props to keep:**

- `mounted` — used by WifiPage setup flow
- `isAuthenticated` — used for conditional features
- `displayName` — used for display in page content (WifiPage title display)

**Container components (`WifiPage.tsx`, `DnsPage.tsx`):**

- Remove `login`, `clearAuth`, `oidcEnabled` imports if no longer needed
- Remove `onLogin`/`onLogout` handler definitions if only NavBar used them

### Step 7: Handle `astro:page-load` for re-initialization

With view transitions, SolidJS islands using `client:only` will be swapped on navigation. Since we're using `<ClientRouter />`, the new page's islands get mounted after the swap. Things to verify:

- `createEffect` for `document.title` — fires on mount, should work fine.
- `onMount` in `WifiPage`/`DnsPage` — fires when the component mounts on the new page, should work.
- Nanostores — global state, shared across navigations automatically (module-level singletons persist in SPA mode).

**Important**: Because `<ClientRouter />` makes this a SPA, module-level code (nanostores, etc.) persists across navigations. This is actually ideal for our auth state. But URL-derived state (like `$wifiParams` and `$dnsParams` which initialize from `window.location.search`) needs to re-initialize when navigating. We need to ensure the stores re-read from the URL when the page loads.

**Solution**: Add an `astro:before-swap` or `astro:page-load` listener that re-initializes the URL-derived stores, OR restructure so the components re-read URL params on mount. Since the SolidJS islands are re-mounted on each navigation (they aren't persisted), their `onMount` → `useStore` flow should naturally pick up the current store values. The stores themselves read from `window.location.search` at creation time (module top-level) — but in SPA mode, the module only executes once.

**This is the key challenge**: `$wifiParams` and `$dnsParams` initialize from `URLSearchParams` at module load time. In SPA mode, navigating from `/dns?tab=android` to `/?ssid=foo` won't re-run the module initializer.

**Fix**: Add an `astro:page-load` event listener in each store module that re-syncs state from the URL. OR create a small inline script in Layout that dispatches a custom event the stores listen to. The simplest approach: add a re-initialization function to each store that's called from an `astro:page-load` listener.

```typescript
// In params.ts for each store
export function reinitFromURL() {
  const p = new URLSearchParams(window.location.search)
  // re-set each key from URL
}

// In a global script or Layout inline script
document.addEventListener("astro:page-load", () => {
  // Determine which page we're on and reinit the relevant store
})
```

Alternatively, since each page's container component calls `onMount`, we can call `reinitFromURL()` there.

---

## File Changes Summary

| File                                        | Action                                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| `src/layouts/Layout.astro`                  | Add `<ClientRouter />`, `NavBarIsland`, `<main transition:animate="slide">` wrapper |
| `src/components/NavBar/NavBarIsland.astro`  | **Create** — Astro wrapper with `transition:persist`                                |
| `src/components/NavBar/NavBarContainer.tsx` | **Create** — SolidJS container that subscribes to auth + tracks path                |
| `src/components/NavBar/index.ts`            | Update barrel to also export `NavBarContainer`                                      |
| `src/components/WifiPage/WifiPageView.tsx`  | Remove `<NavBar>` rendering, remove `onLogin`/`onLogout`/`oidcEnabled` from props   |
| `src/components/WifiPage/WifiPage.tsx`      | Stop passing NavBar-only props to view                                              |
| `src/components/DnsPage/DnsPageView.tsx`    | Remove `<NavBar>` rendering, remove `onLogin`/`onLogout`/`oidcEnabled` from props   |
| `src/components/DnsPage/DnsPage.tsx`        | Stop passing NavBar-only props to view                                              |
| `src/lib/wifi/params.ts` (or equivalent)    | Add `reinitFromURL()` for SPA-mode URL sync                                         |
| `src/lib/dns/params.ts`                     | Add `reinitFromURL()` for SPA-mode URL sync                                         |

---

## Considerations & Open Questions

1. **`transition:persist` with `client:only`** — Astro docs confirm that `transition:persist` works on islands with `client:` directives. The island keeps its internal state and isn't re-rendered. We need to use `transition:persist-props` as well since there are no server-provided props to update.

2. **URL-derived store re-initialization** — This is the trickiest part. Options:
   - (A) Call `reinitFromURL()` in each page container's `onMount`
   - (B) Use a single `astro:page-load` listener in a shared script that dispatches to the correct store based on pathname
   - Recommendation: **(A)** — keeps it simple and colocated with each page.

3. **Toast persistence** — `ToastRegion` is currently rendered inside each page view. With view transitions, toasts may disappear on navigation. Should we also persist the toast region in Layout? Probably yes — move `<ToastRegion />` into the Layout (inside the persisted island or as its own persisted island).

4. **OAuth callback page** — `pages/oauth/callback.astro` exists. Does it use the Layout? If so, the NavBar will show there too. We may want to conditionally hide it, or exclude the callback from view transitions via `data-astro-reload`.

5. **`withParams` helper in NavBar links** — Currently NavBar links append the current page's query string to the target. In SPA mode with `<ClientRouter />`, clicking these links triggers client-side navigation via the router. The `withParams` reactive function reads `window.location.search` — this should still work since it's called at render time. But we should verify it picks up the latest search params after a navigation.

6. **Slide direction** — The `slide` animation slides old content left, new content from right (forward). On back navigation, it reverses. This should feel natural for Wifi↔DNS transitions.

---

## Implementation Order

1. Create `NavBarContainer.tsx`
2. Create `NavBarIsland.astro`
3. Update `Layout.astro` (add ClientRouter, NavBarIsland, main wrapper)
4. Remove NavBar from `WifiPageView` + `DnsPageView` and clean up props
5. Add `reinitFromURL()` to store modules and call from `onMount` in containers
6. Test navigation between pages — verify slide animation, NavBar persistence, auth state preservation, URL params
7. Move `ToastRegion` to Layout if toast state is lost during transitions
