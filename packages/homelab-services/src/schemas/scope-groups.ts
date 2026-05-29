import { ResourceFlags } from "./feature-flags.js"
import { HashSetFromArray } from "./HashSetFromArray.js"

export const ScopeGroupSchema = ResourceFlags

export type ScopeOrGroup = typeof ScopeGroupSchema.Type

export const ScopeGroupSetSchema = HashSetFromArray(ScopeGroupSchema)

export type ScopeOrGroupSet = typeof ScopeGroupSetSchema.Type
