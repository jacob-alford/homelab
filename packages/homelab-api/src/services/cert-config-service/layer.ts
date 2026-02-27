import { Effect, Layer } from "effect"

import type * as Schemas from "../../schemas/index.js"
import { UuidDictionaryService } from "../uuid-dictionary-service/index.js"
import type { UUID } from "../uuid-service/definition.js"
import type { CertConfigServiceDef } from "./definition.js"
import { CertConfigService } from "./definition.js"

export const CertConfigServiceLive = Layer.effect(
  CertConfigService,
  Effect.gen(function*() {
    return new CertConfigServiceImpl(
      yield* UuidDictionaryService,
    )
  }),
)

class CertConfigServiceImpl implements CertConfigServiceDef {
  constructor(
    private readonly uuids: typeof UuidDictionaryService.Service,
  ) {}

  intermediateCert(filename: string, payload: Buffer): Effect.Effect<Schemas.CertificatePayload.CertificateConfig> {
    return this.cert(
      filename,
      payload,
      this.uuids.intermediateCertPayloadUuid,
      "Plato Splunk Intermediate",
      "An intermediate CA certificate belonging to a RADIUS authentication server",
    )
  }

  rootCert(filename: string, payload: Buffer): Effect.Effect<Schemas.CertificatePayload.CertificateConfig> {
    return this.cert(
      filename,
      payload,
      this.uuids.rootCertPayloadUuid,
      "Plato Splunk Root",
      "A root CA certificate for TLS and RADIUS authentication",
    )
  }

  private cert(filename: string, payload: Buffer, uuid: UUID, displayName: string, description: string) {
    return Effect.succeed(
      {
        PayloadCertificateFileName: filename,
        PayloadContent: payload,
        PayloadDescription: description,
        PayloadDisplayName: displayName,
        PayloadIdentifier: `com.apple.security.root.${uuid}`,
        PayloadType: "com.apple.security.root",
        PayloadUUID: uuid,
        PayloadVersion: 1,
      } satisfies Schemas.CertificatePayload.CertificateConfig,
    )
  }
}
