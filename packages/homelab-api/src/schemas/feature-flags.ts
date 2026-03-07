import { Schema } from "effect"
import { Operation } from "../operation.js"
import { Resource } from "../resource.js"
import { ListStringToSet } from "./ListStringToSet.js"

export const ResourceOperationFlags = Schema.TemplateLiteral(
  Schema.Literal(...Object.values(Resource)),
  ".",
  Schema.Literal(...Object.values(Operation)),
)

export const ResourceFlags = Schema.Union(
  Schema.Literal(...Object.values(Resource)),
  ResourceOperationFlags,
)

export const ResourceFlagsEnabled = Schema.TemplateLiteral(
  ResourceFlags,
  ".enabled",
)

export const AllEnabled = Schema.Literal("*")

export const FeatureFlags = Schema.Union(
  ResourceFlagsEnabled,
  AllEnabled,
)

export type FeatureFlags = typeof FeatureFlags.Type

export const FeatureFlagsSetSchema = ListStringToSet(
  Schema.String.pipe(
    Schema.compose(FeatureFlags),
  ),
)

export type FeatureFlagsSet = typeof FeatureFlagsSetSchema.Type
