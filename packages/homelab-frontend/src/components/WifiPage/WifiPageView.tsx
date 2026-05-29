import { Button } from "@kobalte/core/button"
import { Tabs } from "@kobalte/core/tabs"
import { BiSolidError } from "solid-icons/bi"
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
  displayName: string | null
  copyingLink: boolean
  canDownload: boolean
  effectiveUsername: string
  usernameOverride: string
  passwordOverride: string
  onUsernameOverrideChange: (value: string) => void
  onPasswordOverrideChange: (value: string) => void
  onLogin: () => void
  onLogout: () => void
  onDownloadAppleProfile: () => void
  onDownloadCert: () => void
  onCopyDownloadLink: () => void
  onCopyUsername: () => void
  onCopyPassword: () => void
}

function MissingParams() {
  return (
    <div class="wifi-page__missing">
      <BiSolidError class="wifi-page__missing-icon" />
      <p>
        Missing required query parameter: <code>ssid</code>.
      </p>
    </div>
  )
}

export function WifiPageView(props: WifiPageViewProps) {
  const hasRequiredParams = () => props.mounted && !!props.ssid

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
              <span class="wifi-page__display-name">{props.displayName}</span>
              <Button class="wifi-page__login-btn" onClick={props.onLogout}>
                Logout
              </Button>
            </div>
          </Show>
        </Show>
      </nav>

      <Show when={hasRequiredParams()} fallback={props.mounted ? <MissingParams /> : null}>
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
              usernameOverride={props.usernameOverride}
              passwordOverride={props.passwordOverride}
              onUsernameOverrideChange={props.onUsernameOverrideChange}
              onPasswordOverrideChange={props.onPasswordOverrideChange}
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
      </Show>
      <ToastRegion />
    </div>
  )
}
