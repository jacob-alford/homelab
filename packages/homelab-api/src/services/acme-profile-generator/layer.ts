import { Effect, Layer, pipe, Schema } from "effect"

import * as ApiErrors from "../../errors/http-errors.js"
import * as Schemas from "../../schemas/index.js"
import { AcmeConfigService } from "../acme-config-service/index.js"
import { CertConfigService } from "../cert-config-service/index.js"
import { CertificateService } from "../certificate-service/index.js"
import { RootPayloadService } from "../root-payload-service/index.js"
import type { AcmeProfileServiceDef } from "./definition.js"
import { AcmeProfileService } from "./definition.js"

export const AcmeProfileServiceLive = Layer.effect(
  AcmeProfileService,
  Effect.gen(function*() {
    return new AcmeProfileServiceImpl(
      yield* AcmeConfigService,
      yield* CertConfigService,
      yield* CertificateService,
      yield* RootPayloadService,
    )
  }),
)

class AcmeProfileServiceImpl implements AcmeProfileServiceDef {
  constructor(
    private readonly acmeConfigService: typeof AcmeConfigService.Service,
    private readonly certConfigService: typeof CertConfigService.Service,
    private readonly certs: typeof CertificateService.Service,
    private readonly rootPayloadService: typeof RootPayloadService.Service,
  ) {}

  acmeProfile(
    ...acmeParams: Parameters<typeof AcmeConfigService.Service.acmeConfig>
  ): Effect.Effect<Schemas.RootPayload.RootPayloadWire, ApiErrors.HttpApiEncodeError> {
    const acmeConfigService = this.acmeConfigService
    const certConfigService = this.certConfigService
    const certs = this.certs
    const rootPayloadService = this.rootPayloadService

    return Effect.gen(function*() {
      const rootCertPayload = yield* certConfigService.rootCert(
        "roots.crt",
        certs.rootCert,
      )

      const acmePayload = yield* acmeConfigService.acmeConfig(...acmeParams)

      return yield* pipe(
        rootPayloadService.rootPayload(
          rootCertPayload,
          acmePayload,
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
