import { Effect, HashSet, Layer } from "effect"
import { Config, type Operation, type ResourceURIs, type Schemas, Services } from "homelab-services"

export const FeatureFlagServiceLive = Layer.effect(
  Services.FeatureFlagService.FeatureFlagService,
  Effect.gen(function*() {
    const flags = yield* Config.Env.featureFlags

    return new FeatureFlagServiceImpl(
      flags,
    )
  }),
)

class FeatureFlagServiceImpl implements Services.FeatureFlagService.FeatureFlagServiceDef {
  constructor(
    private readonly flags: Schemas.FeatureFlags.FeatureFlagsSet,
  ) {}

  enabled(resource: ResourceURIs.ResourceURIs, op: Operation): boolean {
    return this.allEnabled || this.resourceEnabled(resource) || this.resourceOpEnabled(resource, op)
  }

  private get allEnabled() {
    return HashSet.has(this.flags, "*")
  }

  private resourceOpEnabled(resource: ResourceURIs.ResourceURIs, op: Operation) {
    return HashSet.has(this.flags, `${resource}.${op}.enabled`)
  }

  private resourceEnabled(resource: ResourceURIs.ResourceURIs) {
    return HashSet.has(this.flags, `${resource}.enabled`)
  }
}
