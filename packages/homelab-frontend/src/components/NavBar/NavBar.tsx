import { Button } from "@kobalte/core/button"
import { Option } from "effect"
import { Show } from "solid-js"
import * as Lib from "../../lib/index.js"
import "./NavBar.css"

export interface NavBarProps {
  currentPath: string
  mounted: boolean
  oidcEnabled: boolean
  isAuthenticated: boolean
  displayName: Option.Option<string>
  wifiHref: string
  dnsHref: string
  onLogin: () => void
  onLogout: () => void
}

export function NavBar(props: NavBarProps) {
  const isActive = (route: string) => Lib.Env.isAppPath(props.currentPath, route)

  return (
    <nav class="navbar">
      <div class="navbar__left">
        <img src={`${Lib.Env.BASE_PATH}/logo.png`} alt="Homelab" class="navbar__logo" />
        <a href={props.wifiHref} class="navbar__link" classList={{ "navbar__link--active": isActive("/") }}>
          Wifi
        </a>
        <a href={props.dnsHref} class="navbar__link" classList={{ "navbar__link--active": isActive("/dns") }}>
          DNS
        </a>
      </div>
      <div class="navbar__right">
        <Show when={props.mounted && props.oidcEnabled}>
          <Show
            when={props.isAuthenticated}
            fallback={
              <Button class="navbar__login-btn" onClick={props.onLogin}>
                Login
              </Button>
            }
          >
            <div class="navbar__user-info">
              <span class="navbar__display-name">{Option.getOrElse(props.displayName, () => "Guest")}</span>
              <Button class="navbar__login-btn" onClick={props.onLogout}>
                Logout
              </Button>
            </div>
          </Show>
        </Show>
      </div>
    </nav>
  )
}
