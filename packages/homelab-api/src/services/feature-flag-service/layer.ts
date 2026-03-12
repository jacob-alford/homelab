import { Effect, HashSet, Layer, Schema } from "effect"

import type { Operation } from "../../operation.js"
import type { ResourceURIs } from "../../resource-uris.js"
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

  enabled(resource: ResourceURIs, op: Operation): boolean {
    return this.allEnabled || this.resourceEnabled(resource) || this.resourceOpEnabled(resource, op)
  }

  private get allEnabled() {
    return HashSet.has(this.flags, "*")
  }

  private resourceOpEnabled(resource: ResourceURIs, op: Operation) {
    return HashSet.has(this.flags, `${resource}.${op}.enabled`)
  }

  private resourceEnabled(resource: ResourceURIs) {
    return HashSet.has(this.flags, `${resource}.enabled`)
  }
}
