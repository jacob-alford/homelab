import { Schema } from "effect"

export const FeatureFlags = Schema.Literal(
  "mobile-config-acme-enabled",
  "mobile-config-certs-enabled",
  "mobile-config-wifi-enabled",
  "status-health-enabled",
)

export const FeatureFlagsSetSchema = Schema.HashSet(
  FeatureFlags,
)

export type FeatureFlagsSet = typeof FeatureFlagsSetSchema.Type
