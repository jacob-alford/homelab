import { Context } from "effect"
import type * as Schemas from "../../schemas/index.js"

export const FeatureFlagServiceId = "homelab-api/services/feature-flag-service/FeatureFlagService"

export interface FeatureFlagServiceDef {
  readonly featureFlags: Schemas.Env.FeatureFlagsSet
}

export class FeatureFlagService extends Context.Tag(FeatureFlagServiceId)<FeatureFlagService, FeatureFlagServiceDef>() {
}
