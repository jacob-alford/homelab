import { Effect, HashSet, Layer, Schema } from "effect"

import type { Operation } from "../../operation.js"
import type { Resource } from "../../resource.js"
import { type FeatureFlagsSet, FeatureFlagsSetSchema } from "../../schemas/feature-flags.js"
import type { FeatureFlagServiceDef } from "./definition.js"
import { FeatureFlagService } from "./definition.js"

export const FeatureFlagServiceLive = Layer.effect(
  FeatureFlagService,
  Effect.gen(function*() {
    const flags = yield* Schema.Config("FEATURE_FLAGS", FeatureFlagsSetSchema)

    return new FeatureFlagServiceImpl(
      flags,
    )
  }),
)

class FeatureFlagServiceImpl implements FeatureFlagServiceDef {
  constructor(
    private readonly flags: FeatureFlagsSet,
  ) {}

  enabled(resource: Resource, op: Operation): boolean {
    return this.allEnabled || this.resourceEnabled(resource) || this.resourceOpEnabled(resource, op)
  }

  private get allEnabled() {
    return HashSet.has(this.flags, "*")
  }

  private resourceOpEnabled(resource: Resource, op: Operation) {
    return HashSet.has(this.flags, `${resource}.${op}.enabled`)
  }

  private resourceEnabled(resource: Resource) {
    return HashSet.has(this.flags, `${resource}.enabled`)
  }
}
