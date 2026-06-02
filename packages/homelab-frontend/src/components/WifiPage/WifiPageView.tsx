import { Button } from "@kobalte/core/button"
import { Link } from "@kobalte/core/link"
import { Tabs } from "@kobalte/core/tabs"
import { Option } from "effect"
import { FaSolidCircleArrowLeft } from "solid-icons/fa"
import { Show } from "solid-js"
import { ToastRegion } from "../Toast/index.js"
import { AndroidTab } from "./AndroidTab.js"
import { AppleTab } from "./AppleTab.js"
import "./WifiPage.css"

export interface WifiPageViewProps {
  mounted: boolean
  ssid: string
  encryption: "WPA2" | "WPA3"
  isAuthenticated: boolean
  displayName: Option.Option<string>
  copyingLink: boolean
  canDownload: boolean
  effectiveUsername: Option.Option<string>
  username: Option.Option<string>
  password: Option.Option<string>
  onUsernameChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onLogin: () => void
  onLogout: () => void
  onDownloadAppleProfile: () => void
  onDownloadCert: () => void
  onCopyDownloadLink: () => void
  onCopyUsername: () => void
  onCopyPassword: () => void
  onAdjustParameters: () => void
}

export function WifiPageView(props: WifiPageViewProps) {
  return (
    <div class="wifi-page">
      <nav class="wifi-page__topbar">
        <Show when={props.mounted}>
          <Show
            when={props.isAuthenticated}
            fallback={
              <Button class="wifi-page__login-btn" onClick={props.onLogin}>
                Login
              </Button>
            }
          >
            <div class="wifi-page__user-info">
              <span class="wifi-page__display-name">{Option.getOrElse(props.displayName, () => "Guest")}</span>
              <Button class="wifi-page__login-btn" onClick={props.onLogout}>
                Logout
              </Button>
            </div>
          </Show>
        </Show>
      </nav>

      <Link class="wifi-page__adjust-link" onClick={props.onAdjustParameters}>
        <FaSolidCircleArrowLeft />
        <span>Adjust parameters</span>
      </Link>

      <Tabs defaultValue="apple" class="wifi-page__tabs">
        <Tabs.List class="wifi-page__tabs-list">
          <Tabs.Trigger value="apple" class="wifi-page__tabs-trigger">Apple</Tabs.Trigger>
          <Tabs.Trigger value="android" class="wifi-page__tabs-trigger">Android</Tabs.Trigger>
          <Tabs.Indicator class="wifi-page__tabs-indicator" />
        </Tabs.List>

        <Tabs.Content value="apple" class="wifi-page__tabs-content">
          <AppleTab
            ssid={props.ssid}
            encryption={props.encryption}
            isAuthenticated={props.isAuthenticated}
            canDownload={props.canDownload}
            copyingLink={props.copyingLink}
            username={props.username}
            password={props.password}
            onUsernameChange={props.onUsernameChange}
            onPasswordChange={props.onPasswordChange}
            onDownloadAppleProfile={props.onDownloadAppleProfile}
            onCopyDownloadLink={props.onCopyDownloadLink}
          />
        </Tabs.Content>

        <Tabs.Content value="android" class="wifi-page__tabs-content">
          <AndroidTab
            ssid={props.ssid}
            effectiveUsername={props.effectiveUsername}
            onDownloadCert={props.onDownloadCert}
            onCopyUsername={props.onCopyUsername}
            onCopyPassword={props.onCopyPassword}
          />
        </Tabs.Content>
      </Tabs>
      <ToastRegion />
    </div>
  )
}
