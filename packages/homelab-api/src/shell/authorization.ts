import { Layer } from "effect"
import { AuthorizationServiceLive } from "../services/authorization-service/layer.js"
import { FeatureFlagServiceLive } from "../services/feature-flag-service/layer.js"
import { FineGrainedAuthorizationServiceLive } from "../services/fine-grained-authorization-service/layer.js"

export const Aggregate = AuthorizationServiceLive.pipe(
  Layer.provide(
    Layer.merge(FeatureFlagServiceLive, FineGrainedAuthorizationServiceLive),
  ),
)
