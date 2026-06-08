import type { Option } from "effect"
import type { Schemas } from "homelab-services"
import { useAppParams } from "../state.js"

export type DnsProfile = Schemas.DnsProfile.DnsProfile

export type DnsParams = {
  blockAds: Option.Option<boolean>
  tailscale: Option.Option<boolean>
  keepLogs: Option.Option<boolean>
}

export function useDnsParams() {
  const app = useAppParams()

  const dnsParams = (): DnsParams => {
    const p = app.params()
    return {
      blockAds: p.blockAds,
      tailscale: p.tailscale,
      keepLogs: p.keepLogs,
    }
  }

  return {
    params: dnsParams,
    tab: () => app.params().tab,
    queryString: app.queryString,
    setTab: app.setTab,
    setBlockAds: app.setBlockAds,
    setTailscale: app.setTailscale,
    setKeepLogs: app.setKeepLogs,
  }
}

export type UseDnsParams = ReturnType<typeof useDnsParams>

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
