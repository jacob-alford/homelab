import { Button } from "@kobalte/core/button"
import { Link } from "@kobalte/core/link"
import { TextField } from "@kobalte/core/text-field"
import { Option } from "effect"
import { BiSolidCopy } from "solid-icons/bi"
import { Show } from "solid-js"
import { LabeledSwitch } from "../LabeledSwitch/index.js"

const IDM_URL = import.meta.env.PUBLIC_IDM_URL

export interface AppleTabProps {
  ssid: string
  encryption: "WPA2" | "WPA3"
  oidcEnabled: boolean
  isAuthenticated: boolean
  canDownload: boolean
  copyingLink: boolean
  enterpriseClientType: "PEAP" | "EAP-TLS" | "None"
  includeEthernetProfile: boolean
  showEthernetSwitch: boolean
  username: Option.Option<string>
  password: Option.Option<string>
  onUsernameChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onIncludeEthernetProfileChange: (value: boolean) => void
  onDownloadAppleProfile: () => void
  onCopyDownloadLink: () => void
}

export function AppleTab(props: AppleTabProps) {
  return (
    <>
      <p class="wifi-page__description">
        Click download below to download an Apple profile to connect to the <strong>{props.ssid}</strong>{" "}
        wifi network ({props.encryption}).
        <Show when={props.oidcEnabled && props.isAuthenticated && props.enterpriseClientType !== "EAP-TLS"}>
          {" "}Click{" "}
          <Link href={`${IDM_URL}/ui/radius`} target="_blank" rel="noopener noreferrer">
            here
          </Link>{" "}
          to view your Radius password.
        </Show>
        <Show when={props.enterpriseClientType === "EAP-TLS"}>
          {" "}This profile uses certificate-based authentication (EAP-TLS). No username or password is needed.
        </Show>
      </p>
      <Show when={props.oidcEnabled && props.isAuthenticated && props.enterpriseClientType === "PEAP"}>
        <div class="wifi-page__overrides">
          <TextField
            class="wifi-page__override-field"
            value={Option.getOrElse(props.username, () => "")}
            onChange={props.onUsernameChange}
          >
            <TextField.Label class="wifi-page__override-label">Username</TextField.Label>
            <TextField.Input class="wifi-page__override-input" />
          </TextField>
          <TextField
            class="wifi-page__override-field"
            value={Option.getOrElse(props.password, () => "")}
            onChange={props.onPasswordChange}
          >
            <TextField.Label class="wifi-page__override-label">Password</TextField.Label>
            <TextField.Input class="wifi-page__override-input" />
          </TextField>
        </div>
      </Show>
      <Show when={props.showEthernetSwitch}>
        <div class="wifi-page__switches">
          <LabeledSwitch
            label="Include ethernet profile"
            checked={props.includeEthernetProfile}
            onChange={props.onIncludeEthernetProfileChange}
          />
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
        <Show when={props.oidcEnabled && props.isAuthenticated}>
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
