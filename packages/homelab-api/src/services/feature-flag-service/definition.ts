import { Context, Effect } from "effect"
import type { Operation } from "../../operation.js"
import type { Resource } from "../../resource.js"

export const FeatureFlagServiceId = "homelab-api/services/feature-flag-service/FeatureFlagService"

export interface FeatureFlagServiceDef {
  enabled(resource: Resource, operation: Operation): boolean
}

export class FeatureFlagService extends Context.Tag(FeatureFlagServiceId)<FeatureFlagService, FeatureFlagServiceDef>() {
}

export function enabled(...params: Parameters<FeatureFlagServiceDef["enabled"]>): Effect.Effect<
  boolean,
  never,
  FeatureFlagService
> {
  return FeatureFlagService.pipe(
    Effect.map(
      (_) => _.enabled(...params),
    ),
  )
}
