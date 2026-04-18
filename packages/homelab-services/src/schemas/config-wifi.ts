import { Schema } from "effect"

import { GenericPayloadSchema } from "./payload-generic.js"

export const TLSVersionSchema = Schema.TemplateLiteral(Schema.Number, Schema.Literal("."), Schema.Number)

export const WifiEncryptionType = Schema.Literal("WPA2", "WPA3")
export type WifiEncryptionType = typeof WifiEncryptionType.Type

export const EnterpriseClientConfigurationType = Schema.Literal("PEAP", "EAP-TLS")

export const PEAPClientConfigurationSchema = Schema.Struct({
  AcceptEAPTypes: Schema.Array(Schema.Int.pipe(Schema.positive())),
  PayloadCertificateAnchorUUID: Schema.Array(Schema.UUID),
  TLSMaximumVersion: TLSVersionSchema,
  TLSMinimumVersion: TLSVersionSchema,
  TLSTrustedServerNames: Schema.Array(Schema.String),
  UserName: Schema.String,
  UserPassword: Schema.String,
})

export const WifiConfigSchema = GenericPayloadSchema.pipe(
  Schema.extend(
    Schema.Struct({
      AutoJoin: Schema.Boolean,
      CaptiveBypass: Schema.Boolean,
      DisableAssociationMACRandomization: Schema.Boolean,
      EAPClientConfiguration: PEAPClientConfigurationSchema.pipe(Schema.optionalWith({ exact: true })),
      EncryptionType: WifiEncryptionType,
      HIDDEN_NETWORK: Schema.Boolean,
      IsHotspot: Schema.Boolean,
      ProxyType: Schema.String,
      SSID_STR: Schema.String,
      Password: Schema.String.pipe(Schema.optionalWith({ exact: true })),
    }),
  ),
)

export type WifiConfig = typeof WifiConfigSchema.Type
