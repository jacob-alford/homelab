import { Effect, Layer } from "effect"

import * as Env from "../../config/env.js"
import { ProfileUuidConfig } from "../../config/profile-uuid-config.js"
import type * as Schemas from "../../schemas/index.js"
import type { AcmeConfigServiceDef } from "./definition.js"
import { AcmeConfigService } from "./definition.js"

export const AcmeConfigServiceLive = Layer.effect(
  AcmeConfigService,
  Effect.gen(function*() {
    const uuids = yield* ProfileUuidConfig
    const acmeUrl = yield* Env.acmeUrl
    const hardwareBound = yield* Env.hardwareBound
    const keyType = yield* Env.keyType
    const keySize = yield* Env.keySize
    return new AcmeConfigServiceImpl(uuids, acmeUrl, hardwareBound, keyType, keySize)
  }),
)

class AcmeConfigServiceImpl implements AcmeConfigServiceDef {
  constructor(
    private readonly uuids: typeof ProfileUuidConfig.Service,
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
