import { Tabs } from "@kobalte/core/tabs"
import type * as Lib from "../../lib/index.js"
import { PageNav } from "../PageNav/index.js"
import { ToastRegion } from "../Toast/index.js"
import { AndroidTab } from "./AndroidTab.js"
import { AppleTab } from "./AppleTab.js"
import "./DnsPage.css"

export interface DnsPageViewProps {
  isAuthenticated: boolean
  blockAds: boolean
  tailscale: boolean
  keepLogs: boolean
  tab: Lib.State.Tab
  copyingLink: boolean
  wifiHref: string
  onTabChange: (tab: Lib.State.Tab) => void
  onBlockAdsChange: (value: boolean) => void
  onTailscaleChange: (value: boolean) => void
  onKeepLogsChange: (value: boolean) => void
  onDownload: () => void
  onCopyDownloadLink: () => void
}

export function DnsPageView(props: DnsPageViewProps) {
  return (
    <div class="dns-page">
      <Tabs value={props.tab} onChange={(v) => props.onTabChange(v as Lib.State.Tab)} class="dns-page__tabs">
        <Tabs.List class="dns-page__tabs-list">
          <Tabs.Trigger value="apple" class="dns-page__tabs-trigger">Apple</Tabs.Trigger>
          <Tabs.Trigger value="android" class="dns-page__tabs-trigger">Android</Tabs.Trigger>
          <Tabs.Indicator class="dns-page__tabs-indicator" />
        </Tabs.List>

        <Tabs.Content value="apple" class="dns-page__tabs-content">
          <AppleTab
            isAuthenticated={props.isAuthenticated}
            blockAds={props.blockAds}
            tailscale={props.tailscale}
            keepLogs={props.keepLogs}
            copyingLink={props.copyingLink}
            onBlockAdsChange={props.onBlockAdsChange}
            onTailscaleChange={props.onTailscaleChange}
            onKeepLogsChange={props.onKeepLogsChange}
            onDownload={props.onDownload}
            onCopyDownloadLink={props.onCopyDownloadLink}
          />
        </Tabs.Content>

        <Tabs.Content value="android" class="dns-page__tabs-content">
          <AndroidTab />
        </Tabs.Content>
      </Tabs>

      <PageNav href={props.wifiHref} label="Configure Wi-Fi" direction="back" />

      <ToastRegion />
    </div>
  )
}
