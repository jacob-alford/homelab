import { Schema } from "effect"
import { GenericPayloadSchema } from "./generic-payload.js"

export const CertificatePayloadSchema = GenericPayloadSchema.pipe(
  Schema.extend(
    Schema.Struct({
      PayloadCertificateFileName: Schema.String,
    }),
  ),
)
