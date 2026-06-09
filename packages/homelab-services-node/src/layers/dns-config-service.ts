import { Effect, Layer, Option } from "effect"
import type { Schemas } from "homelab-services"
import { Config, Services } from "homelab-services"

export const DnsConfigServiceLive = Layer.effect(
  Services.DnsConfigService.DnsConfigService,
  Effect.gen(function*() {
    return new DnsConfigServiceImpl(
      yield* Config.ProfileUuidConfig.ProfileUuidConfig,
    )
  }),
)

const NEVER_CONNECT_DOMAINS = [
  new URL("https://captive.apple.com"),
  new URL("https://3gppnetwork.org"),
  new URL("https://dav.orange.fr"),
  new URL("https://vvm.mobistar.be"),
  new URL("https://vvm.mstore.msg.t-mobile.com"),
  new URL("https://tma.vvm.mone.pan-net.eu"),
  new URL("https://vvm.ee.co.uk"),
]

const SERVER_ADDRESSES = ["45.90.28.0", "2a07:a8c0::", "45.90.30.0", "2a07:a8c1::"]

class DnsConfigServiceImpl implements Services.DnsConfigService.DnsConfigServiceDef {
  constructor(
    private readonly uuids: typeof Config.ProfileUuidConfig.ProfileUuidConfig.Service,
  ) {}

  tailscalePrivate(name: string, ssid: Option.Option<string>): Effect.Effect<Schemas.DnsConfig.DNSConfig> {
    return this.buildConfig("546af2", name, ssid)
  }

  tailscaleMonitor(name: string, ssid: Option.Option<string>): Effect.Effect<Schemas.DnsConfig.DNSConfig> {
    return this.buildConfig("cbc883", name, ssid)
  }

  homelabPrivate(name: string, ssid: Option.Option<string>): Effect.Effect<Schemas.DnsConfig.DNSConfig> {
    return this.buildConfig("ae8918", name, ssid)
  }

  homelabPrivateResolverOnly(name: string, ssid: string): Effect.Effect<Schemas.DnsConfig.DNSConfig> {
    return this.buildConfig("dd66bf", name, Option.some(ssid))
  }

  private buildConfig(
    profileId: string,
    name: string,
    ssid: Option.Option<string>,
  ): Effect.Effect<Schemas.DnsConfig.DNSConfig> {
    const ssidMatch = Option.match(ssid, {
      onNone: () => ({}),
      onSome: (s) => ({ SSIDMatch: [s] }),
    })

    return Effect.succeed({
      DNSSettings: {
        DNSProtocol: "HTTPS" as const,
        ServerURL: new URL(`https://apple.dns.nextdns.io/${profileId}/${name}`),
        ServerAddresses: SERVER_ADDRESSES,
        AllowFailover: false,
      },
      OnDemandRules: [
        {
          Action: "EvaluateConnection" as const,
          ActionParameters: [
            {
              DomainAction: "NeverConnect" as const,
              Domains: NEVER_CONNECT_DOMAINS,
            },
          ],
          ...ssidMatch,
        },
        {
          Action: "Connect" as const,
          ...ssidMatch,
        },
      ],
      ProhibitDisablement: false,
      PayloadType: "com.apple.dnsSettings.managed",
      PayloadIdentifier: `alford.plato-splunk.homelab.dns.${profileId}`,
      PayloadUUID: this.uuids.homelabConfigDnsUuid,
      PayloadDisplayName: "Homelab DNS Config",
      PayloadDescription: "This profile configures encrypted DNS resolution for the device.",
      PayloadOrganization: "Plato Splunk Media",
      PayloadVersion: 1,
    })
  }
}
