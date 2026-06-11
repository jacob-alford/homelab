import { Schema } from "effect"
import { ScopeGroupSetSchema } from "./scope-groups.js"

export const StatusSelfResponseSchema = Schema.Struct({
  isTailscale: Schema.Boolean,
  permissions: ScopeGroupSetSchema,
  principal: Schema.String,
  fullname: Schema.OptionFromNullOr(Schema.String),
})

export type StatusSelfResponse = typeof StatusSelfResponseSchema.Type
