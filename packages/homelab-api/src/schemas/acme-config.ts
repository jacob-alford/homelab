import { Schema } from "effect"
import { GenericPayloadSchema } from "./generic-payload.js"

export const AcmeConfig = GenericPayloadSchema.pipe(
  Schema.extend(
    Schema.Struct({
      Attest: Schema.Boolean,
      ClientIdentifer: Schema.String,
      DirectoryURL: Schema.URL,
      HardwareBound: Schema.Boolean,
      KeySize: Schema.Int.pipe(Schema.positive()),
      KeyType: Schema.String,
    }),
  ),
)
