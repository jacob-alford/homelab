import { FileSystem } from "@effect/platform"
import { Effect, Layer } from "effect"
import { Config, Services } from "homelab-services"
import * as Crypto from "node:crypto"

export const HMACServiceLive = Layer.effect(
  Services.HMACService.HMACService,
  Effect.gen(function*() {
    const secretFilePath = yield* Config.Env.hmacSecretFilePath
    const fs = yield* FileSystem.FileSystem
    const secret = yield* fs.readFileString(secretFilePath)

    return new HMACServiceImpl(secret.trim())
  }),
)

class HMACServiceImpl implements Services.HMACService.HMACServiceDef {
  constructor(private readonly secret: string) {}

  hmacDigest(data: string) {
    return Effect.try({
      try: () => Crypto.createHmac("sha256", this.secret).update(data).digest("hex"),
      catch: (error) => new Services.HMACService.HMACDigestError({ error }),
    })
  }
}
