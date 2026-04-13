import type { DateTime } from "effect"
import { Context, Data, Effect } from "effect"
import type { HMACDigestError } from "../hmac-service/definition.js"

export const NonceServiceId = "homelab-api/services/nonce-service/NonceService"

export class NonceValidationError extends Data.TaggedError("NonceValidationError")<
  {
    readonly reason: "invalid-format" | "invalid-hmac"
    readonly message: string
  }
> {}

export interface NonceServiceDef {
  readonly withTime: (time: DateTime.DateTime) => Effect.Effect<string, HMACDigestError>
  readonly validateNonce: (nonce: string) => Effect.Effect<DateTime.DateTime, NonceValidationError | HMACDigestError>
}

export class NonceService extends Context.Tag(NonceServiceId)<NonceService, NonceServiceDef>() {
}

export function withTime(
  time: DateTime.DateTime,
): Effect.Effect<string, HMACDigestError, NonceService> {
  return NonceService.pipe(
    Effect.flatMap(
      (_) => _.withTime(time),
    ),
  )
}

export function validateNonce(
  nonce: string,
): Effect.Effect<DateTime.DateTime, NonceValidationError | HMACDigestError, NonceService> {
  return NonceService.pipe(
    Effect.flatMap(
      (_) => _.validateNonce(nonce),
    ),
  )
}
