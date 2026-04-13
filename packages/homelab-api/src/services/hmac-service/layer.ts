import { FileSystem } from "@effect/platform"
import { Config, Effect, Layer } from "effect"
import * as Crypto from "node:crypto"
import { HMACDigestError, HMACService, type HMACServiceDef } from "./definition.js"

export const HMACServiceLive = Layer.effect(
  HMACService,
  Effect.gen(function*() {
    const secretFilePath = yield* Config.string("HOMELAB_SECRET_FILE")
    const fs = yield* FileSystem.FileSystem
    const secret = yield* fs.readFileString(secretFilePath)

    return new HMACServiceImpl(secret.trim())
  }),
)

class HMACServiceImpl implements HMACServiceDef {
  constructor(private readonly secret: string) {}

  hmacDigest(data: string) {
    return Effect.try({
      try: () => Crypto.createHmac("sha256", this.secret).update(data).digest("hex"),
      catch: (error) => new HMACDigestError({ error }),
    })
  }
}
