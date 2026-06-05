import { Schema } from "effect"

export const CertFormat = Schema.Literal("crt", "der")

export type CertFormat = typeof CertFormat.Type
