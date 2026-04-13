import { DateTime, Effect, Layer } from "effect"
import { Constants } from "homelab-shared"
import { HMACService } from "../hmac-service/definition.js"
import { NonceService, type NonceServiceDef, NonceValidationError } from "./definition.js"

export const NonceServiceLive = Layer.effect(
  NonceService,
  Effect.gen(function*() {
    const hmacService = yield* HMACService

    return new NonceServiceImpl(hmacService)
  }),
)

class NonceServiceImpl implements NonceServiceDef {
  constructor(private readonly hmacService: typeof HMACService.Service) {}

  withTime(time: DateTime.DateTime) {
    return Effect.gen(this, function*() {
      const epochSeconds = Math.floor(DateTime.toEpochMillis(time) / Constants.MS_PER_S)
      const timestamp = epochSeconds.toString()
      const hmac = yield* this.hmacService.hmacDigest(timestamp)

      return `${timestamp}.${hmac}`
    })
  }

  validateNonce(nonce: string) {
    return Effect.gen(this, function*() {
      const parts = nonce.split(".")
      if (parts.length !== 2) {
        return yield* new NonceValidationError({
          reason: "invalid-format",
          message: "Nonce must contain exactly two parts separated by a period",
        })
      }

      const [timestamp, hmac] = parts

      const epochSeconds = Number(timestamp)
      if (!Number.isFinite(epochSeconds)) {
        return yield* new NonceValidationError({
          reason: "invalid-format",
          message: "Nonce timestamp is not a valid number",
        })
      }

      const expectedHmac = yield* this.hmacService.hmacDigest(timestamp!)
      if (expectedHmac !== hmac) {
        return yield* new NonceValidationError({
          reason: "invalid-hmac",
          message: "Nonce HMAC verification failed",
        })
      }

      return DateTime.unsafeMake(epochSeconds * Constants.MS_PER_S)
    })
  }
}
