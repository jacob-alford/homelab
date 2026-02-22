import { HttpApiBuilder, HttpApiSwagger, HttpMiddleware, Path } from "@effect/platform"
import { BunFileSystem, BunHttpServer, BunPath, BunRuntime } from "@effect/platform-bun"
import { Config, Effect, Layer } from "effect"
import { Services } from "homelab-api"
import { ApiLive } from "./api.js"

const HomeLabApiLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiSwagger.layer()),
  Layer.provide(ApiLive),
  Layer.provide(
    BunHttpServer.layer({ port: 3000 }),
  ),
  Layer.provide(
    Services.XmlPrintingProviderApplePlist.AppleMdmXmlPrintingLive,
  ),
  Layer.provide(
    Services.WifiProfileGeneratorService.WifiProfileServiceLive,
  ),
  Layer.provide(
    Services.WifiPayloadService.WifiPayloadServiceLive,
  ),
  Layer.provide(
    Services.XmlPrintingProviderApplePlist.AppleMdmXmlPrintingConfigDefault,
  ),
  Layer.provide(
    Services.CertPayloadService.CertPayloadServiceLive,
  ),
  Layer.provide(
    Services.CertificateService.CertificateServiceLive,
  ),
  Layer.provide(
    Services.UuidService.UuidServiceLive,
  ),
  Layer.provide(
    Services.UuidDictionaryService.UuidDictionaryServiceLive,
  ),
  Layer.provide(
    BunFileSystem.layer,
  ),
  Layer.provide(
    Layer.effect(
      Services.CertificateService.CertificateServiceConfig,
      Effect.gen(function*() {
        const path = yield* Path.Path

        const basePath = yield* Config.string("BASE_PATH")
        const rootCertPath = yield* Config.string("ROOT_CERT")
        const intermediateCertPath = yield* Config.string("INTERMEDIATE_CERT")

        const rootCert = path.resolve(basePath, rootCertPath)
        const intermediateCert = path.resolve(basePath, intermediateCertPath)

        return {
          rootCert,
          intermediateCert,
        }
      }),
    ),
  ),
  Layer.provide(
    BunPath.layer,
  ),
)

Layer.launch(
  HomeLabApiLive,
).pipe(
  BunRuntime.runMain,
)
