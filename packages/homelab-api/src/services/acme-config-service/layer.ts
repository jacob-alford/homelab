import { Effect, Layer } from "effect"

import { AcmeConfigOptions } from "../../config/acme-config.js"
import { UuidDictionaryService } from "../../config/uuid-config.js"
import type * as Schemas from "../../schemas/index.js"
import type { AcmeConfigServiceDef } from "./definition.js"
import { AcmeConfigService } from "./definition.js"

export const AcmeConfigServiceLive = Layer.effect(
  AcmeConfigService,
  Effect.gen(function*() {
    return new AcmeConfigServiceImpl(
      yield* UuidDictionaryService,
      yield* AcmeConfigOptions,
    )
  }),
)

class AcmeConfigServiceImpl implements AcmeConfigServiceDef {
  constructor(
    private readonly uuids: typeof UuidDictionaryService.Service,
    private readonly options: typeof AcmeConfigOptions.Service,
  ) {}

  acmeConfig(clientIdentifier: string): Effect.Effect<Schemas.ACME.AcmeConfig> {
    return Effect.succeed(
      {
        Attest: this.options.hardwareBound,
        ClientIdentifer: clientIdentifier,
        DirectoryURL: new URL(this.options.acmeUrl),
        HardwareBound: this.options.hardwareBound,
        KeySize: this.options.keySize,
        KeyType: this.options.keyType,
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
