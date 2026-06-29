import { Effect, Layer } from "effect"
import type { Schemas } from "homelab-services"
import { Config, Services } from "homelab-services"

export const EapClientConfigServiceLive = Layer.effect(
  Services.EapClientConfigService.EapClientConfigService,
  Effect.gen(function*() {
    return new EapClientConfigServiceImpl(
      yield* Config.ProfileUuidConfig.ProfileUuidConfig,
    )
  }),
)

class EapClientConfigServiceImpl implements Services.EapClientConfigService.EapClientConfigServiceDef {
  constructor(
    private readonly uuids: typeof Config.ProfileUuidConfig.ProfileUuidConfig.Service,
  ) {}

  peapConfig(
    username: string,
    password: string,
  ): Effect.Effect<Schemas.WifiConfig.PEAPClientConfiguration> {
    return Effect.succeed({
      AcceptEAPTypes: [25],
      PayloadCertificateAnchorUUID: [
        this.uuids.homelabPayloadRootCertUuid,
        this.uuids.homelabPayloadIntermediateCertUuid,
      ],
      TLSMaximumVersion: "1.3",
      TLSMinimumVersion: "1.2",
      TLSTrustedServerNames: ["radius.plato-splunk.media"],
      UserName: username,
      UserPassword: password,
    })
  }

  eapTlsConfig(): Effect.Effect<Schemas.WifiConfig.EAPTLSClientConfiguration> {
    return Effect.succeed({
      AcceptEAPTypes: [13],
      PayloadCertificateAnchorUUID: [
        this.uuids.homelabPayloadRootCertUuid,
        this.uuids.homelabPayloadIntermediateCertUuid,
      ],
      TLSMaximumVersion: "1.3",
      TLSMinimumVersion: "1.2",
      TLSTrustedServerNames: ["radius.plato-splunk.media"],
    })
  }
}
