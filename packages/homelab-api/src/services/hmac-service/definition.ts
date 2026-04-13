import { Context, Data, Effect } from "effect"

export const HMACServiceId = "homelab-api/services/hmac-service/HMACService"

export class HMACDigestError extends Data.TaggedError("HMACDigestError")<
  {
    readonly error: unknown
  }
> {}

export interface HMACServiceDef {
  readonly hmacDigest: (data: string) => Effect.Effect<string, HMACDigestError>
}

export class HMACService extends Context.Tag(HMACServiceId)<HMACService, HMACServiceDef>() {
}

export function hmacDigest(
  data: string,
): Effect.Effect<string, HMACDigestError, HMACService> {
  return HMACService.pipe(
    Effect.flatMap(
      (_) => _.hmacDigest(data),
    ),
  )
}
