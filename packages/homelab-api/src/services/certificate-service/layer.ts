import { FileSystem } from "@effect/platform"
import { Effect, Layer } from "effect"

import { CertificateReadError, CertificateService, CertificateServiceConfig } from "./definition.js"

export const CertificateServiceLive = Layer.effect(
  CertificateService,
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const config = yield* CertificateServiceConfig

    const rootCert = yield* fs.readFile(config.rootCert).pipe(
      Effect.mapBoth({
        onFailure: (error) => new CertificateReadError({ error }),
        onSuccess: (result) => Buffer.from(result),
      }),
    )

    const intermediateCert = yield* fs.readFile(config.intermediateCert).pipe(
      Effect.mapBoth({
        onFailure: (error) => new CertificateReadError({ error }),
        onSuccess: (result) => Buffer.from(result),
      }),
    )

    return {
      rootCert,
      intermediateCert,
    }
  }),
)
