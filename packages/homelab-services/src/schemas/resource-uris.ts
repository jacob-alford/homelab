import { Schema } from "effect"

export const ResourceURISchema = Schema.Literal(
  "Config_Wifi",
  "Config_Certs",
  "Config_DNS",
  "Cert_Root",
  "Cert_Intermediate",
  "Cert_Combined",
  "Status_Health",
  "Status_Self",
  "OAuth_Token",
  "OAuth_ClaimCheck",
)

export const ResourceURILiterals = ResourceURISchema.literals
