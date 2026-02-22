import { Effect, Layer } from "effect"

import type { Schemas } from "../../index.js"
import { UuidDictionaryService } from "../uuid-dictionary-service/index.js"
import type { CertPayloadServiceDef } from "./definition.js"
import { CertPayloadService } from "./definition.js"

export const CertPayloadServiceLive = Layer.effect(
  CertPayloadService,
  Effect.gen(function*() {
    return new CertPayloadServiceImpl(
      yield* UuidDictionaryService,
    )
  }),
)

class CertPayloadServiceImpl implements CertPayloadServiceDef {
  constructor(
    private readonly uuids: typeof UuidDictionaryService.Service,
  ) {}

  cert(filename: string, payload: Buffer, type: "root" | "intermediate") {
    const uuids = this.uuids

    const uuid = type === "root" ? uuids.rootCertPayloadUuid : uuids.intermediateCertPayloadUuid

    return Effect.succeed(
      {
        PayloadCertificateFileName: filename,
        PayloadContent: payload,
        PayloadDescription: type === "root"
          ? "Adds a root CA certificate"
          : "Adds an intermediate CA certificate for 802.11x",
        PayloadDisplayName: type === "root" ? "Plato Splunk Root" : "Plato Splunk Intermediate Cert",
        PayloadIdentifier: `com.apple.security.root.${uuid}`,
        PayloadType: "com.apple.security.root",
        PayloadUUID: uuid,
        PayloadVersion: 1,
      } satisfies Schemas.CertificatePayload.CertificatePayload,
    )
  }
}
