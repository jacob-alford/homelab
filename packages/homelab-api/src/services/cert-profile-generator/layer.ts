import { Effect, Layer, pipe, Schema } from "effect"

import { ApiErrors } from "../../index.js"
import * as Schemas from "../../schemas/index.js"
import { CertConfigService } from "../cert-config-service/index.js"
import { CertificateService } from "../certificate-service/index.js"
import { RootPayloadService } from "../root-payload-service/index.js"
import type { CertProfileServiceDef } from "./definition.js"
import { CertProfileService } from "./definition.js"

export const CertProfileServiceLive = Layer.effect(
  CertProfileService,
  Effect.gen(function*() {
    return new CertProfileServiceImpl(
      yield* CertConfigService,
      yield* CertificateService,
      yield* RootPayloadService,
    )
  }),
)

class CertProfileServiceImpl implements CertProfileServiceDef {
  constructor(
    private readonly certConfigService: typeof CertConfigService.Service,
    private readonly certs: typeof CertificateService.Service,
    private readonly rootPayloadService: typeof RootPayloadService.Service,
  ) {}

  get certProfile(): Effect.Effect<Schemas.RootPayload.RootPayloadWire, ApiErrors.HttpApiEncodeError> {
    const certConfigService = this.certConfigService
    const certs = this.certs
    const rootPayloadService = this.rootPayloadService

    return Effect.gen(function*() {
      const rootCertPayload = yield* certConfigService.rootCert(
        "roots.crt",
        certs.rootCert,
      )

      const intermediatePayload = yield* certConfigService.intermediateCert(
        "intermediates.crt",
        certs.intermediateCert,
      )

      return yield* pipe(
        rootPayloadService.rootPayload(
          rootCertPayload,
          intermediatePayload,
        ),
        Effect.andThen(
          Schema.encode(
            Schemas.RootPayload.RootPayloadSchema,
          ),
        ),
        Effect.catchTag(
          "ParseError",
          ApiErrors.HttpApiEncodeError.fromParseError,
        ),
      )
    })
  }
}
