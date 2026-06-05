import { Button } from "@kobalte/core/button"
import { Link } from "@kobalte/core/link"
import { Option } from "effect"
import { BiSolidCopy } from "solid-icons/bi"
import { Show } from "solid-js"

export interface AndroidTabProps {
  ssid: string
  effectiveUsername: Option.Option<string>
  password: Option.Option<string>
  onDownloadRootCert: () => void
  onDownloadIntermediateCert: () => void
  onCopyUsername: () => void
  onCopyPassword: () => void
}

export function AndroidTab(props: AndroidTabProps) {
  const isEnterprise = () => Option.isSome(props.effectiveUsername)

  return (
    <>
      <h3 class="wifi-page__connect-heading">Connect To: {props.ssid}</h3>
      <ol class="wifi-page__steps">
        <Show when={isEnterprise()}>
          <li>
            <p class="wifi-page__description">Download the Root CA certificate to your device.</p>
            <Button class="wifi-page__download-btn" onClick={props.onDownloadRootCert}>
              Download Root Certificate
            </Button>
          </li>
          <li>
            <p class="wifi-page__description">Download the Intermediate CA certificate to your device.</p>
            <Button class="wifi-page__download-btn" onClick={props.onDownloadIntermediateCert}>
              Download Intermediate Certificate
            </Button>
          </li>
          <li>
            <p class="wifi-page__description">
              Follow{" "}
              <Link href="#" class="wifi-page__link">
                this guide
              </Link>{" "}
              to install and trust the certificates on your Android device.
            </p>
          </li>
        </Show>
        <li>
          <p class="wifi-page__description">
            Connect to the wifi network using the credentials below.
          </p>
          <div class="wifi-page__credentials">
            <Show when={isEnterprise()}>
              <div class="wifi-page__copy-group">
                <Button class="wifi-page__copy-btn" onClick={props.onCopyUsername}>
                  <BiSolidCopy />
                  <span>Copy Username</span>
                </Button>
                <span class="wifi-page__copy-subtext">
                  copies: {Option.getOrElse(props.effectiveUsername, () => "")}
                </span>
              </div>
            </Show>
            <div class="wifi-page__copy-group">
              <Button class="wifi-page__copy-btn" onClick={props.onCopyPassword}>
                <BiSolidCopy />
                <span>Copy Password</span>
              </Button>
              <span class="wifi-page__copy-subtext">
                copies: {Option.getOrElse(props.password, () => "")}
              </span>
            </div>
          </div>
        </li>
      </ol>
    </>
  )
}
