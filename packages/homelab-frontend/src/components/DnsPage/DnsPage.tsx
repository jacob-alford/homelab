import { useStore } from "@nanostores/solid"
import { Option } from "effect"
import { createEffect, createSignal, onMount } from "solid-js"
import * as Lib from "../../lib/index.js"
import { showErrorToast, showSuccessToast } from "../Toast/index.js"
import { DnsPageView } from "./DnsPageView.js"
import "./DnsPage.css"

export function DnsPage() {
  const isAuthenticated = useStore(Lib.Auth.State.$isAuthenticated)
  const auth = useStore(Lib.Auth.State.$auth)
  const dns = Lib.Dns.State.useDnsParams()
  const [mounted, setMounted] = createSignal(false)
  const [copyingLink, setCopyingLink] = createSignal(false)

  const dnsParams = dns.params

  const effectiveBlockAds = () => {
    const p = dnsParams()
    const ts = Option.getOrElse(p.tailscale, () => false)
    return ts ? true : Option.getOrElse(p.blockAds, () => true)
  }
  const effectiveTailscale = () => Option.getOrElse(dnsParams().tailscale, () => false)
  const effectiveKeepLogs = () => Option.getOrElse(dnsParams().keepLogs, () => false)

  const wifiHref = () => {
    const qs = dns.queryString()
    return qs ? `${Lib.Env.appPath("/")}?${qs}` : Lib.Env.appPath("/")
  }

  onMount(() => setMounted(true))

  createEffect(() => {
    const profile = Lib.Dns.State.deriveProfile({
      blockAds: effectiveBlockAds(),
      tailscale: effectiveTailscale(),
      keepLogs: effectiveKeepLogs(),
    })
    document.title = `Homelab | DNS | ${Lib.Dns.State.profileFriendlyName(profile)}`
  })

  const token = () =>
    Option.map(auth().token, (t) => t.id_token ?? "").pipe(
      Option.filter((t) => t !== ""),
    )

  function handleDownload() {
    const p = dnsParams()
    Lib.Runtime.runEffect(Lib.Dns.Effects.downloadDnsProfile({
      blockAds: p.blockAds,
      tailscale: p.tailscale,
      keepLogs: p.keepLogs,
      token: token(),
    })).catch((err) => {
      showErrorToast(err instanceof Error ? err.message : "Failed to download DNS profile")
    })
  }

  function handleCopyDownloadLink() {
    setCopyingLink(true)
    const p = dnsParams()
    Lib.Runtime.runEffect(Lib.Dns.Effects.copyDnsDownloadLink({
      blockAds: p.blockAds,
      tailscale: p.tailscale,
      keepLogs: p.keepLogs,
    }))
      .then(() => showSuccessToast("Download link copied to clipboard"))
      .catch((err) => showErrorToast(err instanceof Error ? err.message : "Failed to copy link"))
      .finally(() => setCopyingLink(false))
  }

  function handleTabChange(t: Lib.State.Tab) {
    if (!mounted()) return
    dns.setTab(t)
  }

  function handleBlockAdsChange(value: boolean) {
    dns.setBlockAds(Option.some(value))
  }

  function handleTailscaleChange(value: boolean) {
    dns.setTailscale(Option.some(value))
    if (value) {
      dns.setBlockAds(Option.some(true))
    }
  }

  function handleKeepLogsChange(value: boolean) {
    dns.setKeepLogs(Option.some(value))
  }

  return (
    <DnsPageView
      isAuthenticated={isAuthenticated()}
      blockAds={effectiveBlockAds()}
      tailscale={effectiveTailscale()}
      keepLogs={effectiveKeepLogs()}
      tab={dns.tab()}
      copyingLink={copyingLink()}
      wifiHref={wifiHref()}
      onTabChange={handleTabChange}
      onBlockAdsChange={handleBlockAdsChange}
      onTailscaleChange={handleTailscaleChange}
      onKeepLogsChange={handleKeepLogsChange}
      onDownload={handleDownload}
      onCopyDownloadLink={handleCopyDownloadLink}
    />
  )
}
