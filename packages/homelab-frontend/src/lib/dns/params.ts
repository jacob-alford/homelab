import { Option, Record } from "effect"
import type { Schemas } from "homelab-services"
import { atom, map, onSet } from "nanostores"

export type DnsTab = "apple" | "android"

export type DnsProfile = Schemas.DnsProfile.DnsProfile

export type DnsParams = {
  blockAds: Option.Option<boolean>
  tailscale: Option.Option<boolean>
  keepLogs: Option.Option<boolean>
}

function initTabFromURL(): DnsTab {
  if (typeof window === "undefined") return "apple"
  const tab = new URLSearchParams(window.location.search).get("tab")
  return tab === "android" ? "android" : "apple"
}

function initFromURL(): DnsParams {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null
  const blockAds = params?.get("blockAds")
  const tailscale = params?.get("tailscale")
  const keepLogs = params?.get("keepLogs")

  return {
    blockAds: Option.fromNullable(blockAds === "true" ? true : blockAds === "false" ? false : null),
    tailscale: Option.fromNullable(tailscale === "true" ? true : tailscale === "false" ? false : null),
    keepLogs: Option.fromNullable(keepLogs === "true" ? true : keepLogs === "false" ? false : null),
  }
}

export const $dnsTab = atom<DnsTab>(initTabFromURL())

export const $dnsParams = map<DnsParams>(initFromURL())

export function deriveProfile(params: { blockAds: boolean; tailscale: boolean; keepLogs: boolean }): DnsProfile {
  if (params.tailscale && params.keepLogs) return "monitoring_tailscale"
  if (params.tailscale) return "private_tailscale"
  if (!params.blockAds) return "private_homelab_resolver_only"
  return "private_homelab"
}

export function profileFriendlyName(profile: DnsProfile): string {
  switch (profile) {
    case "private_homelab":
      return "Encrypted + Ad Blocking"
    case "private_homelab_resolver_only":
      return "Resolver Only"
    case "private_tailscale":
      return "Tailscale"
    case "monitoring_tailscale":
      return "Tailscale Monitoring"
  }
}

function syncURL() {
  if (typeof window === "undefined") return

  const params = $dnsParams.get()
  const tab = $dnsTab.get()

  const somes = Record.getSomes({
    blockAds: Option.map(params.blockAds, String),
    tailscale: Option.map(params.tailscale, String),
    keepLogs: Option.map(params.keepLogs, String),
    tab: tab === "android" ? Option.some("android") : Option.none(),
  })

  const qs = new URLSearchParams(somes).toString()
  const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname
  history.replaceState(null, "", newUrl)
}

onSet($dnsParams, () => syncURL())
onSet($dnsTab, () => syncURL())
