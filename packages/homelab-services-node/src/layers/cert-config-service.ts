import { Effect, Layer } from "effect"
import type { Schemas } from "homelab-services"
import { Config, Services } from "homelab-services"

export const CertConfigServiceLive = Layer.effect(
  Services.CertConfigService.CertConfigService,
  Effect.gen(function*() {
    return new CertConfigServiceImpl(
      yield* Config.ProfileUuidConfig.ProfileUuidConfig,
    )
  }),
)

class CertConfigServiceImpl implements Services.CertConfigService.CertConfigServiceDef {
  constructor(
    private readonly uuids: typeof Config.ProfileUuidConfig.ProfileUuidConfig.Service,
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

  private cert(
    filename: string,
    payload: Buffer,
    uuid: Services.UuidService.UUID,
    displayName: string,
    description: string,
  ) {
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
