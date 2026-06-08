import { useStore } from "@nanostores/solid"
import { Option } from "effect"
import { createEffect, createSignal, onMount } from "solid-js"
import { $displayName, $isAuthenticated, clearAuth, login, oidcEnabled } from "../../lib/auth/index.js"
import {
  $dnsParams,
  $dnsTab,
  copyDnsDownloadLink,
  deriveProfile,
  type DnsTab,
  downloadDnsProfile,
  profileFriendlyName,
} from "../../lib/dns/index.js"
import { runEffect } from "../../lib/wifi/index.js"
import { showErrorToast, showSuccessToast } from "../Toast/index.js"
import { DnsPageView } from "./DnsPageView.js"
import "./DnsPage.css"

export function DnsPage() {
  const isAuthenticated = useStore($isAuthenticated)
  const displayName = useStore($displayName)
  const params = useStore($dnsParams)
  const tab = useStore($dnsTab)
  const [mounted, setMounted] = createSignal(false)
  const [copyingLink, setCopyingLink] = createSignal(false)

  const effectiveBlockAds = () => {
    const p = params()
    const ts = Option.getOrElse(p.tailscale, () => false)
    return ts ? true : Option.getOrElse(p.blockAds, () => true)
  }
  const effectiveTailscale = () => Option.getOrElse(params().tailscale, () => false)
  const effectiveKeepLogs = () => Option.getOrElse(params().keepLogs, () => false)

  onMount(() => setMounted(true))

  createEffect(() => {
    const profile = deriveProfile({
      blockAds: effectiveBlockAds(),
      tailscale: effectiveTailscale(),
      keepLogs: effectiveKeepLogs(),
    })
    document.title = `Homelab | DNS | ${profileFriendlyName(profile)}`
  })

  function handleLogin() {
    runEffect(login()).catch((err) => {
      showErrorToast(err instanceof Error ? err.message : "Login failed")
    })
  }

  function handleDownload() {
    runEffect(downloadDnsProfile()).catch((err) => {
      showErrorToast(err instanceof Error ? err.message : "Failed to download DNS profile")
    })
  }

  function handleCopyDownloadLink() {
    setCopyingLink(true)
    runEffect(copyDnsDownloadLink())
      .then(() => showSuccessToast("Download link copied to clipboard"))
      .catch((err) => showErrorToast(err instanceof Error ? err.message : "Failed to copy link"))
      .finally(() => setCopyingLink(false))
  }

  function handleTabChange(t: DnsTab) {
    $dnsTab.set(t)
  }

  function handleBlockAdsChange(value: boolean) {
    $dnsParams.setKey("blockAds", Option.some(value))
  }

  function handleTailscaleChange(value: boolean) {
    $dnsParams.setKey("tailscale", Option.some(value))
    if (value) {
      $dnsParams.setKey("blockAds", Option.some(true))
    }
  }

  function handleKeepLogsChange(value: boolean) {
    $dnsParams.setKey("keepLogs", Option.some(value))
  }

  return (
    <DnsPageView
      mounted={mounted()}
      oidcEnabled={oidcEnabled}
      isAuthenticated={isAuthenticated()}
      displayName={displayName()}
      blockAds={effectiveBlockAds()}
      tailscale={effectiveTailscale()}
      keepLogs={effectiveKeepLogs()}
      tab={tab()}
      copyingLink={copyingLink()}
      onTabChange={handleTabChange}
      onBlockAdsChange={handleBlockAdsChange}
      onTailscaleChange={handleTailscaleChange}
      onKeepLogsChange={handleKeepLogsChange}
      onDownload={handleDownload}
      onCopyDownloadLink={handleCopyDownloadLink}
      onLogin={handleLogin}
      onLogout={clearAuth}
    />
  )
}
