import { useStore } from "@nanostores/solid"
import { createSignal, onMount } from "solid-js"
import { $displayName, $isAuthenticated, clearAuth, login, oidcEnabled } from "../../lib/auth/index.js"
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
