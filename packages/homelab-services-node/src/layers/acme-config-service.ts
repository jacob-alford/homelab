import { Effect, Layer } from "effect"
import type { Schemas } from "homelab-services"
import { Config, Services } from "homelab-services"

export const AcmeConfigServiceLive = Layer.effect(
  Services.AcmeConfigService.AcmeConfigService,
  Effect.gen(function*() {
    const uuids = yield* Config.ProfileUuidConfig.ProfileUuidConfig
    const acmeUrl = yield* Config.Env.acmeUrl
    const hardwareBound = yield* Config.Env.hardwareBound
    const keyType = yield* Config.Env.keyType
    const keySize = yield* Config.Env.keySize
    return new AcmeConfigServiceImpl(uuids, acmeUrl, hardwareBound, keyType, keySize)
  }),
)

class AcmeConfigServiceImpl implements Services.AcmeConfigService.AcmeConfigServiceDef {
  constructor(
    private readonly uuids: typeof Config.ProfileUuidConfig.ProfileUuidConfig.Service,
    private readonly acmeUrl: URL,
    private readonly hardwareBound: boolean,
    private readonly keyType: string,
    private readonly keySize: number,
  ) {}

  acmeConfig(clientIdentifier: string): Effect.Effect<Schemas.ACME.AcmeConfig> {
    return Effect.succeed(
      {
        Attest: this.hardwareBound,
        ClientIdentifer: clientIdentifier,
        DirectoryURL: this.acmeUrl,
        HardwareBound: this.hardwareBound,
        KeySize: this.keySize,
        KeyType: this.keyType,
        PayloadDescription: "Configures ACME settings",
        PayloadDisplayName: "ACME",
        PayloadIdentifier: `com.apple.security.acme.${this.uuids.platoSplunkAcmePayloadUuid}`,
        PayloadType: "com.apple.security.acme",
        PayloadUUID: this.uuids.platoSplunkAcmePayloadUuid,
        PayloadVersion: 1,
      } satisfies Schemas.ACME.AcmeConfig,
    )
  }
}
