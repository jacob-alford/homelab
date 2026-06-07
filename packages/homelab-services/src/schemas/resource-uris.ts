import { Schema } from "effect"

export const ResourceURISchema = Schema.Literal(
  "Config_Wifi",
  "Config_ACME",
  "Config_Certs",
  "Config_DNS",
  "Cert_Root",
  "Cert_Intermediate",
  "Cert_Combined",
  "Status_Health",
  "OAuth_Token",
  "OAuth_ClaimCheck",
)

export const ResourceURILiterals = ResourceURISchema.literals
