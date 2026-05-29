import { Schema } from "effect"

export const ResourceURISchema = Schema.Literal(
  "Config_Wifi",
  "Config_ACME",
  "Config_Certs",
  "Status_Health",
  "OAuth_Token",
  "OAuth_ClaimCheck",
)

export const ResourceURILiterals = ResourceURISchema.literals
