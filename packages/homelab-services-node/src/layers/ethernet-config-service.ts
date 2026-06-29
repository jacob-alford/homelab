import { Effect, Layer } from "effect"
import type { Schemas } from "homelab-services"
import { Config, Services } from "homelab-services"

export const EthernetConfigServiceLive = Layer.effect(
  Services.EthernetConfigService.EthernetConfigService,
  Effect.gen(function*() {
    return new EthernetConfigServiceImpl(
      yield* Config.ProfileUuidConfig.ProfileUuidConfig,
    )
  }),
)

class EthernetConfigServiceImpl implements Services.EthernetConfigService.EthernetConfigServiceDef {
  constructor(
    private readonly uuids: typeof Config.ProfileUuidConfig.ProfileUuidConfig.Service,
  ) {}

  ethernetConfig(
    eapClientConfiguration: Schemas.WifiConfig.EnterpriseClientConfiguration,
  ): Effect.Effect<Schemas.WifiConfig.EthernetConfig> {
    const uuid = this.uuids.homelabPayloadEthernetUuid
    return Effect.succeed({
      AutoJoin: true,
      SetupModes: ["System"],
      AuthenticationMethod: "",
      EAPClientConfiguration: eapClientConfiguration,
      PayloadDescription: "Configures 802.1X Ethernet settings",
      PayloadDisplayName: "Ethernet",
      PayloadIdentifier: `com.apple.globalethernet.managed.${uuid}`,
      PayloadType: "com.apple.globalethernet.managed",
      PayloadUUID: uuid,
      PayloadVersion: 1,
    })
  }
}
