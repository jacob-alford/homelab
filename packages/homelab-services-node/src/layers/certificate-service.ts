import { FileSystem } from "@effect/platform"
import { Effect, Layer } from "effect"
import { Config, Services } from "homelab-services"

export const CertificateServiceLive = Layer.effect(
  Services.CertificateService.CertificateService,
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const rootCertPath = yield* Config.Env.rootCertDerPath
    const intermediateCertPath = yield* Config.Env.intermediateCertDerPath

    const rootCert = yield* fs.readFile(rootCertPath).pipe(
      Effect.mapBoth({
        onFailure: (error) => new Services.CertificateService.CertificateReadError({ error }),
        onSuccess: (result) => Buffer.from(result),
      }),
    )

    const intermediateCert = yield* fs.readFile(intermediateCertPath).pipe(
      Effect.mapBoth({
        onFailure: (error) => new Services.CertificateService.CertificateReadError({ error }),
        onSuccess: (result) => Buffer.from(result),
      }),
    )

    return {
      rootCert,
      intermediateCert,
    }
  }),
)
