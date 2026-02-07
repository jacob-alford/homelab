import { Schema } from "effect"
import { AcmeConfig } from "./acme-config.js"
import { GenericPayloadSchema } from "./generic-payload.js"

export const AcmePayloadFull = GenericPayloadSchema.pipe(
  Schema.omit("PayloadContent"),
  Schema.extend(Schema.Struct({
    PayloadContent: AcmeConfig,
  })),
)
