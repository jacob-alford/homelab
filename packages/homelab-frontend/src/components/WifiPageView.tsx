import { Button } from "@kobalte/core/button"
import { Tabs } from "@kobalte/core/tabs"
import { BiSolidCopy, BiSolidError } from "solid-icons/bi"
import { Show } from "solid-js"
import { ToastRegion } from "./Toast.js"
import "./WifiPage.css"

export interface WifiPageViewProps {
  mounted: boolean
  ssid: string
  encryption: "WPA2" | "WPA3"
  password: string
  isAuthenticated: boolean
  displayName: string | null
  copyingLink: boolean
  onLogin: () => void
  onLogout: () => void
  onDownloadAppleProfile: () => void
  onDownloadCert: () => void
  onCopyDownloadLink: () => void
  onCopyPassword: () => void
}

function MissingParams() {
  return (
    <div class="wifi-page__missing">
      <BiSolidError class="wifi-page__missing-icon" />
      <p>
        Missing required query parameters: <code>ssid</code> or <code>password</code>.
      </p>
    </div>
  )
}

export function WifiPageView(props: WifiPageViewProps) {
  const hasRequiredParams = () => props.mounted && !!props.ssid && !!props.password

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
            <p class="wifi-page__description">
              Click download below to download an Apple profile to connect to the <strong>{props.ssid}</strong>{" "}
              wifi network ({props.encryption}).
            </p>
            <div class="wifi-page__actions">
              <Button class="wifi-page__download-btn" onClick={props.onDownloadAppleProfile}>
                Download
              </Button>
              <Show when={props.isAuthenticated}>
                <Button
                  class="wifi-page__copy-btn"
                  onClick={props.onCopyDownloadLink}
                  disabled={props.copyingLink}
                >
                  <Show
                    when={props.copyingLink}
                    fallback={
                      <>
                        <BiSolidCopy />
                        <span>Copy Download Link</span>
                      </>
                    }
                  >
                    <span class="wifi-page__spinner" />
                    <span>Copying...</span>
                  </Show>
                </Button>
              </Show>
            </div>
          </Tabs.Content>

          <Tabs.Content value="android" class="wifi-page__tabs-content">
            <h3 class="wifi-page__connect-heading">Connect To: {props.ssid}</h3>
            <ol class="wifi-page__steps">
              <li>
                <p class="wifi-page__description">Download the CA certificate to your device.</p>
                <Button class="wifi-page__download-btn" onClick={props.onDownloadCert}>
                  Download Certificate
                </Button>
              </li>
              <li>
                <p class="wifi-page__description">
                  Connect to the wifi network using the credentials below.
                </p>
                <div class="wifi-page__credentials">
                  <Button class="wifi-page__copy-btn" onClick={props.onCopyPassword}>
                    <BiSolidCopy />
                    <span>Copy Password</span>
                  </Button>
                </div>
              </li>
            </ol>
          </Tabs.Content>
        </Tabs>
      </Show>
      <ToastRegion />
    </div>
  )
}
