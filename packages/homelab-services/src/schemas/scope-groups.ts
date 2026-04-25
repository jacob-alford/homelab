import { Schema } from "effect"
import { ListStringToSet } from "./ListStringToSet.js"

import { StringFromUint8Array } from "./Buffer.js"
import { ResourceFlags } from "./feature-flags.js"

export const ScopeGroupSchema = ResourceFlags

export type ScopeOrGroup = typeof ScopeGroupSchema.Type

export const ScopeGroupSetSchema = ListStringToSet(
  Schema.String.pipe(
    Schema.compose(ScopeGroupSchema),
  ),
)

export const ScopeGroupSetSchemaFromUint8Array = Schema.compose(
  StringFromUint8Array,
  ScopeGroupSetSchema,
)

export const ScopeGroupSetFromArray = Schema.compose(
  Schema.Array(ScopeGroupSchema),
)

export type ScopeOrGroupSet = typeof ScopeGroupSetSchema.Type
