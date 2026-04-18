import { Schema } from "effect"
import { ListStringToSet } from "./ListStringToSet.js"

import { ResourceFlags } from "./feature-flags.js"

export const ScopeGroupSchema = ResourceFlags

export type ScopeOrGroup = typeof ScopeGroupSchema.Type

export const ScopeGroupSetSchema = ListStringToSet(
  Schema.String.pipe(
    Schema.compose(ScopeGroupSchema),
  ),
)

export type ScopeOrGroupSet = typeof ScopeGroupSetSchema.Type
