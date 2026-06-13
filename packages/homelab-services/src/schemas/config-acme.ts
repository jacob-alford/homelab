import { Schema } from "effect"
import { GenericPayloadSchema } from "./payload-generic.js"

export const AcmeConfigSchema = GenericPayloadSchema.pipe(
  Schema.extend(
    Schema.Struct({
      Attest: Schema.Boolean,
      ClientIdentifier: Schema.String,
      DirectoryURL: Schema.URL,
      HardwareBound: Schema.Boolean,
      KeySize: Schema.Int.pipe(Schema.positive()),
      KeyType: Schema.String,
      Subject: Schema.NonEmptyArray(Schema.NonEmptyArray(Schema.Tuple(Schema.String, Schema.String))),
    }),
  ),
)

export type AcmeConfig = typeof AcmeConfigSchema.Type
export type AcmeConfigWire = typeof AcmeConfigSchema.Encoded
