import { Layer } from "effect"
import { AuthorizationServiceLive } from "../layers/authorization-service.js"
import { FeatureFlagServiceLive } from "../layers/feature-flag-service.js"
import { FineGrainedAuthorizationServiceLive } from "../layers/fine-grained-authorization-service.js"

export const Aggregate = AuthorizationServiceLive.pipe(
  Layer.provide(
    Layer.merge(FeatureFlagServiceLive, FineGrainedAuthorizationServiceLive),
  ),
)
