import { Layer } from "effect"
import { DPoPTokenValidatorServiceLive } from "../services/dpop-token-validator-service/layer.js"
import { HMACServiceLive } from "../services/hmac-service/layer.js"
import { NonceServiceLive } from "../services/nonce-service/layer.js"

export const Aggregate = DPoPTokenValidatorServiceLive.pipe(
  Layer.provideMerge(NonceServiceLive),
  Layer.provideMerge(HMACServiceLive),
)
