import { Button } from "@kobalte/core/button"
import { BiSolidCopy } from "solid-icons/bi"
import { Show } from "solid-js"
import { LabeledSwitch } from "../LabeledSwitch/index.js"

export interface AppleTabProps {
  isAuthenticated: boolean
  blockAds: boolean
  tailscale: boolean
  keepLogs: boolean
  copyingLink: boolean
  onBlockAdsChange: (value: boolean) => void
  onTailscaleChange: (value: boolean) => void
  onKeepLogsChange: (value: boolean) => void
  onDownload: () => void
  onCopyDownloadLink: () => void
}

export function AppleTab(props: AppleTabProps) {
  return (
    <>
      <h3 class="dns-page__heading">DNS Configuration</h3>
      <p class="dns-page__description">
        Installs a DNS profile to your device with tracker and ad blocking.
      </p>

      <div class="dns-page__switches">
        <div class="dns-page__switch-group">
          <LabeledSwitch
            label="Block Trackers and Ads"
            checked={props.blockAds}
            onChange={props.onBlockAdsChange}
            disabled={props.tailscale}
          />
          <Show when={props.tailscale}>
            <span class="dns-page__switch-subtext">always enabled over tailscale</span>
          </Show>
        </div>

        <Show when={props.isAuthenticated}>
          <div class="dns-page__switch-group">
            <LabeledSwitch
              label="Tailscale"
              checked={props.tailscale}
              onChange={props.onTailscaleChange}
            />
          </div>

          <div class="dns-page__switch-group">
            <LabeledSwitch
              label="Keep Logs"
              checked={props.keepLogs}
              onChange={props.onKeepLogsChange}
            />
          </div>
        </Show>
      </div>

      <div class="dns-page__actions">
        <Button class="dns-page__download-btn" onClick={props.onDownload}>
          Download
        </Button>
        <Button
          class="dns-page__copy-btn"
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
            <span class="dns-page__spinner" />
            <span>Copying...</span>
          </Show>
        </Button>
      </div>
    </>
  )
}
