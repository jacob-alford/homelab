import { Button } from "@kobalte/core/button"
import { Option } from "effect"
import { BiSolidCopy } from "solid-icons/bi"
import { Show } from "solid-js"

export interface AndroidTabProps {
  ssid: string
  effectiveUsername: Option.Option<string>
  onDownloadCert: () => void
  onCopyUsername: () => void
  onCopyPassword: () => void
}

export function AndroidTab(props: AndroidTabProps) {
  return (
    <>
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
          <Show when={Option.isSome(props.effectiveUsername)}>
            <div class="wifi-page__credentials">
              <Button class="wifi-page__copy-btn" onClick={props.onCopyUsername}>
                <BiSolidCopy />
                <span>Copy Username</span>
              </Button>
              <Button class="wifi-page__copy-btn" onClick={props.onCopyPassword}>
                <BiSolidCopy />
                <span>Copy Password</span>
              </Button>
            </div>
          </Show>
        </li>
      </ol>
    </>
  )
}
