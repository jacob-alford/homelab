import { Link } from "@kobalte/core/link"
import { Tabs } from "@kobalte/core/tabs"
import type { Option } from "effect"
import { FaSolidCircleArrowLeft, FaSolidCircleArrowRight } from "solid-icons/fa"
import type { WifiTab } from "../../lib/wifi/index.js"
import { NavBar } from "../NavBar/index.js"
import { ToastRegion } from "../Toast/index.js"
import { AndroidTab } from "./AndroidTab.js"
import { AppleTab } from "./AppleTab.js"
import "./WifiPage.css"

export interface WifiPageViewProps {
  mounted: boolean
  ssid: string
  encryption: "WPA2" | "WPA3"
  oidcEnabled: boolean
  isAuthenticated: boolean
  displayName: Option.Option<string>
  copyingLink: boolean
  canDownload: boolean
  effectiveUsername: Option.Option<string>
  username: Option.Option<string>
  password: Option.Option<string>
  tab: WifiTab
  onTabChange: (tab: WifiTab) => void
  onUsernameChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onLogin: () => void
  onLogout: () => void
  onDownloadAppleProfile: () => void
  onDownloadCombinedCert: () => void
  onCopyDownloadLink: () => void
  onCopyUsername: () => void
  onCopyPassword: () => void
  onCopyDomain: () => void
  onAdjustParameters: () => void
}

export function WifiPageView(props: WifiPageViewProps) {
  const dnsHref = () => {
    if (typeof window === "undefined") return "/dns"
    const qs = window.location.search
    return qs ? `/dns${qs}` : "/dns"
  }
  return (
    <div class="wifi-page">
      <NavBar
        currentPath="/"
        mounted={props.mounted}
        oidcEnabled={props.oidcEnabled}
        isAuthenticated={props.isAuthenticated}
        displayName={props.displayName}
        onLogin={props.onLogin}
        onLogout={props.onLogout}
      />

      <Link class="wifi-page__adjust-link" onClick={props.onAdjustParameters}>
        <FaSolidCircleArrowLeft />
        <span>Adjust parameters</span>
      </Link>

      <Tabs value={props.tab} onChange={(v) => props.onTabChange(v as WifiTab)} class="wifi-page__tabs">
        <Tabs.List class="wifi-page__tabs-list">
          <Tabs.Trigger value="apple" class="wifi-page__tabs-trigger">Apple</Tabs.Trigger>
          <Tabs.Trigger value="android" class="wifi-page__tabs-trigger">Android</Tabs.Trigger>
          <Tabs.Indicator class="wifi-page__tabs-indicator" />
        </Tabs.List>

        <Tabs.Content value="apple" class="wifi-page__tabs-content">
          <AppleTab
            ssid={props.ssid}
            encryption={props.encryption}
            oidcEnabled={props.oidcEnabled}
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
            password={props.password}
            onDownloadCombinedCert={props.onDownloadCombinedCert}
            onCopyUsername={props.onCopyUsername}
            onCopyPassword={props.onCopyPassword}
            onCopyDomain={props.onCopyDomain}
          />
        </Tabs.Content>
      </Tabs>

      <a href={dnsHref()} class="wifi-page__dns-link">
        <span>Configure DNS</span>
        <FaSolidCircleArrowRight />
      </a>

      <ToastRegion />
    </div>
  )
}
