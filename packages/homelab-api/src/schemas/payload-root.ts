import { Schema } from "effect"
import { AcmeConfigSchema } from "./config-acme.js"
import { CertificateConfigSchema } from "./config-certificate.js"
import { WifiConfigSchema } from "./config-wifi.js"
import { ConsentTextSchema } from "./ConsentText.js"
import { GenericPayloadSchema } from "./payload-generic.js"

export const AllPayloadsSchema = Schema.Union(
  WifiConfigSchema,
  CertificateConfigSchema,
  AcmeConfigSchema,
)

export type AllPayloads = typeof AllPayloadsSchema.Type

export type AllPayloadsWire = typeof AllPayloadsSchema.Encoded

export const RootPayloadSchema = GenericPayloadSchema.pipe(
  Schema.omit("PayloadContent"),
  Schema.extend(
    Schema.Struct({
      ConsentText: ConsentTextSchema,
      PayloadContent: Schema.Array(
        AllPayloadsSchema,
      ),
    }),
  ),
)

export type RootPayload = typeof RootPayloadSchema.Type
export type RootPayloadWire = typeof RootPayloadSchema.Encoded
