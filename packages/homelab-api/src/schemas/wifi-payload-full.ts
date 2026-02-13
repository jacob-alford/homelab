import { Schema } from "effect"
import { CertificatePayloadSchema } from "./certificate-payload.js"
import { ConsentTextSchema } from "./consent-text.js"
import { GenericPayloadSchema } from "./generic-payload.js"
import { WifiConfigSchema } from "./wifi-config.js"

export const WifiPayloadFullSchema = GenericPayloadSchema.pipe(
  Schema.omit("PayloadContent"),
  Schema.extend(
    Schema.Struct({
      ConsentText: ConsentTextSchema,
      PayloadContent: Schema.Array(
        Schema.Union(
          WifiConfigSchema,
          CertificatePayloadSchema,
        ),
      ),
    }),
  ),
)

export type WifiPayloadFull = typeof WifiPayloadFullSchema.Type
