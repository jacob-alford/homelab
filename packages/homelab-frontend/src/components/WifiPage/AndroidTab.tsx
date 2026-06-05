import { Button } from "@kobalte/core/button"
import { Option } from "effect"
import { BiSolidCopy } from "solid-icons/bi"
import { Show } from "solid-js"

export interface AndroidTabProps {
  ssid: string
  effectiveUsername: Option.Option<string>
  password: Option.Option<string>
  onDownloadCombinedCert: () => void
  onCopyUsername: () => void
  onCopyPassword: () => void
  onCopyDomain: () => void
}

export function AndroidTab(props: AndroidTabProps) {
  const isEnterprise = () => Option.isSome(props.effectiveUsername)

  return (
    <>
      <h3 class="wifi-page__connect-heading">Connect To: {props.ssid}</h3>
      <ol class="wifi-page__steps">
        <Show when={isEnterprise()}>
          <li>
            <strong>Download and Install Certificate</strong>
            <div class="wifi-page__step-content">
              <p class="wifi-page__description">Download the CA certificate bundle to your device.</p>
              <Button class="wifi-page__download-btn" onClick={props.onDownloadCombinedCert}>
                Download Certificate
              </Button>
              <p class="wifi-page__description">
                After downloading, tap the file when it appears in your notification shade or downloads. Android will
                guide you through installation:
              </p>
              <ul class="wifi-page__install-steps">
                <li>Enter a friendly name for the certificate (e.g. "Home WiFi CA") — remember this name for later</li>
                <li>
                  Under <strong>Credential use</strong>, select <strong>Wi-Fi</strong> (not "VPN and apps")
                </li>
                <li>If prompted, set a lock screen PIN/password first</li>
                <li>
                  Tap <strong>OK</strong> or <strong>Install</strong>
                </li>
              </ul>
              <p class="wifi-page__note">
                Note: the exact steps may vary depending on your Android version or device manufacturer.
              </p>
            </div>
          </li>
        </Show>
        <li>
          <strong>Connect to {props.ssid}</strong>
          <div class="wifi-page__step-content">
            <Show when={isEnterprise()}>
              <p class="wifi-page__description">
                In Settings, navigate to Network & Internet, then Wi-Fi. Select <strong>{props.ssid}</strong>{" "}
                and configure:
              </p>
              <ul class="wifi-page__install-steps">
                <li>
                  Set <strong>EAP method</strong> to <strong>PEAP</strong>
                </li>
                <li>
                  Set <strong>Phase 2 authentication</strong> to <strong>MSCHAPv2</strong>
                </li>
                <li>
                  Under{" "}
                  <strong>CA certificate</strong>, select the certificate you just installed from the dropdown (look for
                  the name you chose earlier — you may need to scroll)
                </li>
                <li>
                  Set <strong>Domain</strong>
                  <div class="wifi-page__copy-group">
                    <Button class="wifi-page__copy-btn" onClick={props.onCopyDomain}>
                      <BiSolidCopy />
                      <span>Copy Domain</span>
                    </Button>
                    <span class="wifi-page__copy-subtext">copies: radius.plato-splunk.media</span>
                  </div>
                </li>
                <li>
                  Enter your <strong>Identity</strong> (username)
                  <div class="wifi-page__copy-group">
                    <Button class="wifi-page__copy-btn" onClick={props.onCopyUsername}>
                      <BiSolidCopy />
                      <span>Copy Username</span>
                    </Button>
                    <span class="wifi-page__copy-subtext">
                      copies: {Option.getOrElse(props.effectiveUsername, () => "")}
                    </span>
                  </div>
                </li>
                <li>
                  Enter your <strong>Password</strong>
                  <div class="wifi-page__copy-group">
                    <Button class="wifi-page__copy-btn" onClick={props.onCopyPassword}>
                      <BiSolidCopy />
                      <span>Copy Password</span>
                    </Button>
                    <span class="wifi-page__copy-subtext">copies: {Option.getOrElse(props.password, () => "")}</span>
                  </div>
                </li>
                <li>
                  Tap <strong>Connect</strong>
                </li>
              </ul>
            </Show>
            <Show when={!isEnterprise()}>
              <p class="wifi-page__description">
                Connect to the wifi network using the password below.
              </p>
              <div class="wifi-page__credentials">
                <div class="wifi-page__copy-group">
                  <Button class="wifi-page__copy-btn" onClick={props.onCopyPassword}>
                    <BiSolidCopy />
                    <span>Copy Password</span>
                  </Button>
                  <span class="wifi-page__copy-subtext">copies: {Option.getOrElse(props.password, () => "")}</span>
                </div>
              </div>
            </Show>
          </div>
        </li>
      </ol>
    </>
  )
}
