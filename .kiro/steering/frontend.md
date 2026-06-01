# Frontend Architecture & Design Principles

This project uses TypeScript, Astro, SolidJS, Effect, and Nanostores.

## State Management

### Single Source of Truth

- All application state lives in nanostores (`map` or `atom`). Components subscribe; they do not own state.
- Use `map<T>` for structured state with multiple keys. Use `atom<T>` only for simple scalar values.
- Use `computed` for derived state (e.g. `$isAuthenticated` derived from `$auth`).
- Never duplicate state across components. If two components need the same data, they subscribe to the same store.

### Option Over Empty Strings / Null

- Use `Option<T>` from Effect to represent values that may or may not be set.
- Never use empty strings as sentinel values for "not set." Empty string is a valid value; absence is `Option.none()`.
- Resolve defaults at the point of consumption (e.g. in effects or at render time via `Option.getOrElse`), not at the store level.
- For impure operations on Options (clipboard writes, DOM mutations), use `Option.match` with explicit `onNone`/`onSome` handlers rather than `Option.map`.

### URL ↔ Store Synchronization

- For URL-driven state, initialize the store from `URLSearchParams` at creation time (not after mount) to avoid loading flashes.
- Sync store changes back to the URL via `onSet` + `history.replaceState`.
- Use `Record.getSomes` from Effect to filter out `None` values before writing to the URL.
- Only `Some` values appear in the URL; `None` values are omitted to keep URLs clean.

### Minimizing Re-renders

- Use nanostores `map` with `setKey` for granular updates — only the changed key triggers re-renders.
- Use `computed` stores for derived values so subscribers only update when the derived value actually changes.
- Prefer `useStore` on the most specific store possible (e.g. `$isAuthenticated` rather than `$auth` if you only need the boolean).

## Component Architecture

### Separation of Concerns

- **Container components** (e.g. `WifiPage`) own logic: store subscriptions, effect invocations, validation, event handlers.
- **View components** (e.g. `WifiPageView`, `AppleTab`) are pure renderers: they receive props and call callbacks. No store access, no effects.
- View components define explicit prop interfaces that serve as API contracts with their consumers.

### Props as Contracts

- Props interfaces are the API boundary between container and view.
- Use `Option<T>` in props when the view needs to distinguish between "set" and "not set" (e.g. to show/hide UI or render placeholders).
- Use concrete types (not Option) when the container guarantees the value is present (e.g. after gating with `Option.all`).
- Callbacks in props are typed by their domain purpose, not their implementation (e.g. `onUsernameChange: (value: string) => void`).

### Gating and Progressive Disclosure

- Use `Show` with `Option.all` to gate on required state before rendering a view.
- When required state is missing, show a setup/configuration view rather than an error screen.
- The setup view writes directly to the store (no local state duplication), so URL sync happens automatically.
- Use a `confirmed` signal to transition between setup and main views; auto-confirm if state is already present on load.

## Effect & Functional Patterns

### Pure Functions and Side Effects

- Business logic (validation, data transformation, default resolution) is pure.
- Side effects (API calls, clipboard, navigation) live inside Effect generators.
- Use `Effect.fn` for named, traceable effect functions.
- Use `yield*` on `Option` values inside Effects to short-circuit on `None` (produces `NoSuchElementException`).

### Dependency Injection

- Use Effect services and layers for dependencies (HTTP client, storage, config).
- Config values use `ConfigProvider` (Astro env vars via `AstroConfigProvider`).
- Never import environment variables directly in business logic; access them through Effect's config system.

### Error Handling

- Effects fail with typed errors. Callers handle errors at the boundary (`.catch` on `runPromise`).
- UI error handling uses toast notifications at the container level, not inside effects.

## Nanostores Conventions

- Store files export the store instance and any helpers (`setAuth`, `clearAuth`).
- `onSet` handlers are defined in the same file as the store for colocation.
- `task()` is used for async initialization (e.g. restoring from sessionStorage).
- For stores that need initial values from the environment (URL, storage), compute them synchronously at store creation time.

## SSR Considerations

- Use `client:only="solid-js"` for components that use client-only APIs (Kobalte Select, portals, etc.).
- Guard `window`/`document` access with `typeof window !== "undefined"` in store initialization code.
- Store modules are safe to import during SSR as long as they don't call client APIs at the top level.
