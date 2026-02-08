import { Schema } from "effect"

export const XMLSymbol = Symbol.for("homelab/XML")

export const XMLSchema = Schema.String.pipe(Schema.brand(XMLSymbol))

export type XML = typeof XMLSchema.Type
