import { Effect, Layer, pipe, Schema } from "effect"
import { ApiErrors, Schemas, Services } from "homelab-services"

export const WifiProfileServiceLive = Layer.effect(
  Services.WifiProfileGeneratorService.WifiProfileService,
  Effect.gen(function*() {
    return new WifiProfileServiceImpl(
      yield* Services.CertConfigService.CertConfigService,
      yield* Services.CertificateService.CertificateService,
      yield* Services.RootPayloadService.RootPayloadService,
      yield* Services.WifiConfigService.WifiConfigService,
      yield* Services.AcmeConfigService.AcmeConfigService,
    )
  }),
)

class WifiProfileServiceImpl implements Services.WifiProfileGeneratorService.WifiProfileServiceDef {
  constructor(
    private readonly certConfigService: typeof Services.CertConfigService.CertConfigService.Service,
    private readonly certs: typeof Services.CertificateService.CertificateService.Service,
    private readonly rootPayloadService: typeof Services.RootPayloadService.RootPayloadService.Service,
    private readonly wifiConfigService: typeof Services.WifiConfigService.WifiConfigService.Service,
    private readonly acmeConfigService: typeof Services.AcmeConfigService.AcmeConfigService.Service,
  ) {}

  wpaPersonalWifi(
    ...wifiParams: Parameters<typeof Services.WifiConfigService.WifiConfigService.Service.wpaPersonalWifi>
  ): Effect.Effect<
    Schemas.RootPayload.RootPayloadWire,
    Services.WifiConfigService.WifiConfigGenerationError | ApiErrors.HttpApiEncodeError
  > {
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
          "Wifi",
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
    ...wifiParams: Parameters<typeof Services.WifiConfigService.WifiConfigService.Service.wpa3EnterprisePeapWifi>
  ): Effect.Effect<
    Schemas.RootPayload.RootPayloadWire,
    Services.WifiConfigService.WifiConfigGenerationError | ApiErrors.HttpApiEncodeError
  > {
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
          "Wifi",
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

  wpa3EnterpriseEAPTLSWifi(
    ...wifiParams: Parameters<typeof Services.WifiConfigService.WifiConfigService.Service.wpa3EnterpriseEAPTLSWifi>
  ): Effect.Effect<
    Schemas.RootPayload.RootPayloadWire,
    Services.WifiConfigService.WifiConfigGenerationError | ApiErrors.HttpApiEncodeError
  > {
    return Effect.gen(this, function*() {
      const [, serialNumber] = wifiParams
      const rootCertPayload = yield* this.certConfigService.rootCert(
        "roots.crt",
        this.certs.rootCert,
      )

      const intermediatePayload = yield* this.certConfigService.intermediateCert(
        "intermediates.crt",
        this.certs.intermediateCert,
      )

      const acmePayload = yield* this.acmeConfigService.acmeConfig(
        serialNumber,
      )

      const wifiPayload = yield* this.wifiConfigService.wpa3EnterpriseEAPTLSWifi(...wifiParams)

      return yield* pipe(
        this.rootPayloadService.rootPayload(
          "Wifi",
          rootCertPayload,
          intermediatePayload,
          wifiPayload,
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
