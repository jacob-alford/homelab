import { Schema } from "effect"

export const ResourceURISchema = Schema.Literal(
  "Config.Wifi",
  "Config.ACME",
  "Config.Certs",
  "Status.Health",
)

export const ResourceURILiterals = ResourceURISchema.literals
