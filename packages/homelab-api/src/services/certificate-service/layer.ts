import { FileSystem } from "@effect/platform"
import { Effect, Layer } from "effect"

import * as Env from "../../config/env.js"
import { CertificateReadError, CertificateService } from "./definition.js"

export const CertificateServiceLive = Layer.effect(
  CertificateService,
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const rootCertPath = yield* Env.rootCertDerPath
    const intermediateCertPath = yield* Env.intermediateCertDerPath

    const rootCert = yield* fs.readFile(rootCertPath).pipe(
      Effect.mapBoth({
        onFailure: (error) => new CertificateReadError({ error }),
        onSuccess: (result) => Buffer.from(result),
      }),
    )

    const intermediateCert = yield* fs.readFile(intermediateCertPath).pipe(
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
