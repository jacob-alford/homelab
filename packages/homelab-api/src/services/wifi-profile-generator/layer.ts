import type { ParseResult } from "effect"
import { Effect, Layer, pipe, Schema } from "effect"

import { ApiErrors } from "../../index.js"
import * as Schemas from "../../schemas/index.js"
import { CertConfigService } from "../cert-config-service/index.js"
import { CertificateService } from "../certificate-service/index.js"
import { RootPayloadService } from "../root-payload-service/index.js"
import type { WifiConfigGenerationError } from "../wifi-config-service/definition.js"
import { WifiConfigService } from "../wifi-config-service/definition.js"
import type { WifiProfileServiceDef } from "./definition.js"
import { WifiProfileService } from "./definition.js"

export const WifiProfileServiceLive = Layer.effect(
  WifiProfileService,
  Effect.gen(function*() {
    return new WifiProfileServiceImpl(
      yield* CertConfigService,
      yield* CertificateService,
      yield* RootPayloadService,
      yield* WifiConfigService,
    )
  }),
)

class WifiProfileServiceImpl implements WifiProfileServiceDef {
  constructor(
    private readonly certConfigService: typeof CertConfigService.Service,
    private readonly certs: typeof CertificateService.Service,
    private readonly rootPayloadService: typeof RootPayloadService.Service,
    private readonly wifiConfigService: typeof WifiConfigService.Service,
  ) {}

  wpaPersonalWifi(
    ...wifiParams: Parameters<typeof WifiConfigService.Service.wpaPersonalWifi>
  ): Effect.Effect<Schemas.RootPayload.RootPayloadWire, WifiConfigGenerationError | ApiErrors.HttpApiEncodeError> {
    const certConfigService = this.certConfigService
    const certs = this.certs
    const rootPayloadService = this.rootPayloadService
    const wifiConfigService = this.wifiConfigService

    return Effect.gen(function*() {
      const rootCertPayload = yield* certConfigService.rootCert(
        "roots.crt",
        certs.rootCert,
      )

      const intermediatePayload = yield* certConfigService.intermediateCert(
        "intermediates.crt",
        certs.intermediateCert,
      )

      const wifiPayload = yield* wifiConfigService.wpaPersonalWifi(...wifiParams)

      return yield* pipe(
        rootPayloadService.rootPayload(
          rootCertPayload,
          intermediatePayload,
          wifiPayload,
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

  wpa3EnterprisePeapWifi(
    ...wifiParams: Parameters<typeof WifiConfigService.Service.wpa3EnterprisePeapWifi>
  ): Effect.Effect<Schemas.RootPayload.RootPayloadWire, WifiConfigGenerationError | ApiErrors.HttpApiEncodeError> {
    const certConfigService = this.certConfigService
    const certs = this.certs
    const rootPayloadService = this.rootPayloadService
    const wifiConfigService = this.wifiConfigService

    return Effect.gen(function*() {
      const rootCertPayload = yield* certConfigService.rootCert(
        "roots.crt",
        certs.rootCert,
      )

      const intermediatePayload = yield* certConfigService.intermediateCert(
        "intermediates.crt",
        certs.intermediateCert,
      )

      const wifiPayload = yield* wifiConfigService.wpa3EnterprisePeapWifi(...wifiParams)

      return yield* pipe(
        rootPayloadService.rootPayload(
          rootCertPayload,
          intermediatePayload,
          wifiPayload,
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
