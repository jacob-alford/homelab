import { Schema } from "effect"
import { GenericPayloadSchema } from "./payload-generic.js"

export const CertificateConfigSchema = GenericPayloadSchema.pipe(
  Schema.extend(
    Schema.Struct({
      PayloadCertificateFileName: Schema.String,
    }),
  ),
)

export type CertificateConfig = typeof CertificateConfigSchema.Type
