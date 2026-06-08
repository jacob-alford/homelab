import { useStore } from "@nanostores/solid"
import { createSignal, onMount } from "solid-js"
import * as Lib from "../../lib/index.js"
import { NavBar } from "./NavBar.js"

export function NavBarContainer() {
  const isAuthenticated = useStore(Lib.Auth.State.$isAuthenticated)
  const displayName = useStore(Lib.Auth.State.$displayName)
  const app = Lib.State.useAppParams()
  const [mounted, setMounted] = createSignal(false)
  const [currentPath, setCurrentPath] = createSignal("/")

  onMount(() => {
    setMounted(true)
    setCurrentPath(window.location.pathname)
    document.addEventListener("astro:page-load", () => {
      setCurrentPath(window.location.pathname)
    })
  })

  const wifiHref = () => {
    const qs = app.queryString()
    return qs ? `${Lib.Env.appPath("/")}?${qs}` : Lib.Env.appPath("/")
  }

  const dnsHref = () => {
    const qs = app.queryString()
    return qs ? `${Lib.Env.appPath("/dns")}?${qs}` : Lib.Env.appPath("/dns")
  }

  function handleLogin() {
    Lib.Runtime.runEffect(Lib.Auth.Effects.login()).catch(() => {})
  }

  return (
    <NavBar
      currentPath={currentPath()}
      mounted={mounted()}
      oidcEnabled={Lib.Auth.Env.oidcEnabled}
      isAuthenticated={isAuthenticated()}
      displayName={displayName()}
      wifiHref={wifiHref()}
      dnsHref={dnsHref()}
      onLogin={handleLogin}
      onLogout={Lib.Auth.State.clearAuth}
    />
  )
}
