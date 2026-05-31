import { Button } from "@kobalte/core/button"
import { Link } from "@kobalte/core/link"
import { TextField } from "@kobalte/core/text-field"
import { BiSolidCopy } from "solid-icons/bi"
import { Show } from "solid-js"

const IDM_URL = import.meta.env.PUBLIC_IDM_URL

export interface AppleTabProps {
  ssid: string
  encryption: "WPA2" | "WPA3"
  isAuthenticated: boolean
  canDownload: boolean
  copyingLink: boolean
  usernameOverride: string
  passwordOverride: string
  onUsernameOverrideChange: (value: string) => void
  onPasswordOverrideChange: (value: string) => void
  onDownloadAppleProfile: () => void
  onCopyDownloadLink: () => void
}

export function AppleTab(props: AppleTabProps) {
  return (
    <>
      <p class="wifi-page__description">
        Click download below to download an Apple profile to connect to the <strong>{props.ssid}</strong>{" "}
        wifi network ({props.encryption}).
        <Show when={props.isAuthenticated}>
          {" "}Click{" "}
          <Link href={`${IDM_URL}/ui/radius`} target="_blank" rel="noopener noreferrer">
            here
          </Link>{" "}
          to view your Radius password.
        </Show>
      </p>
      <Show when={props.isAuthenticated}>
        <div class="wifi-page__overrides">
          <TextField
            class="wifi-page__override-field"
            value={props.usernameOverride}
            onChange={props.onUsernameOverrideChange}
          >
            <TextField.Label class="wifi-page__override-label">Username</TextField.Label>
            <TextField.Input class="wifi-page__override-input" />
          </TextField>
          <TextField
            class="wifi-page__override-field"
            value={props.passwordOverride}
            onChange={props.onPasswordOverrideChange}
          >
            <TextField.Label class="wifi-page__override-label">Password</TextField.Label>
            <TextField.Input class="wifi-page__override-input" />
          </TextField>
        </div>
      </Show>
      <div class="wifi-page__actions">
        <Button
          class="wifi-page__download-btn"
          onClick={props.onDownloadAppleProfile}
          disabled={!props.canDownload}
        >
          Download
        </Button>
        <Show when={props.isAuthenticated}>
          <Button
            class="wifi-page__copy-btn"
            onClick={props.onCopyDownloadLink}
            disabled={props.copyingLink || !props.canDownload}
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
    </>
  )
}
