import { Layer } from "effect"
import { DPoPTokenValidatorServiceLive } from "../layers/dpop-token-validator-service.js"
import { HMACServiceLive } from "../layers/hmac-service.js"
import { NonceServiceLive } from "../layers/nonce-service.js"

export const Aggregate = DPoPTokenValidatorServiceLive.pipe(
  Layer.provideMerge(NonceServiceLive),
  Layer.provideMerge(HMACServiceLive),
)
