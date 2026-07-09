import { Schema } from "effect"

import { Optional } from "./optionals.js"
import { GenericPayloadSchema } from "./payload-generic.js"

export const TLSVersionSchema = Schema.TemplateLiteral(Schema.Number, Schema.Literal("."), Schema.Number)

export const WifiEncryptionType = Schema.Literal("WPA2", "WPA3")
export type WifiEncryptionType = typeof WifiEncryptionType.Type

export const EnterpriseClientConfigurationType = Schema.Literal("PEAP", "EAP-TLS")

export const EnterpriseClientConfigurationBase = Schema.Struct({
  PayloadCertificateAnchorUUID: Schema.Array(Schema.UUID),
  TLSMaximumVersion: TLSVersionSchema,
  TLSMinimumVersion: TLSVersionSchema,
  TLSTrustedServerNames: Schema.Array(Schema.String),
})

export const PEAPClientConfigurationSchema = EnterpriseClientConfigurationBase.pipe(
  Schema.extend(
    Schema.Struct({
      AcceptEAPTypes: Schema.Tuple(Schema.Literal(25)),
      UserName: Schema.String,
      UserPassword: Schema.String,
    }),
  ),
)

export type PEAPClientConfiguration = typeof PEAPClientConfigurationSchema.Type

export const EAPTLSClientConfigurationSchema = EnterpriseClientConfigurationBase.pipe(
  Schema.extend(
    Schema.Struct({
      AcceptEAPTypes: Schema.Tuple(Schema.Literal(13)),
    }),
  ),
)

export type EAPTLSClientConfiguration = typeof EAPTLSClientConfigurationSchema.Type

export const EnterpriseClientConfiguration = Schema.Union(
  PEAPClientConfigurationSchema,
  EAPTLSClientConfigurationSchema,
)

export type EnterpriseClientConfiguration = typeof EnterpriseClientConfiguration.Type

export const WifiConfigSchema = GenericPayloadSchema.pipe(
  Schema.extend(
    Schema.Struct({
      AutoJoin: Schema.Boolean,
      CaptiveBypass: Schema.Boolean,
      DisableAssociationMACRandomization: Schema.Boolean,
      EAPClientConfiguration: Optional(EnterpriseClientConfiguration),
      EncryptionType: WifiEncryptionType,
      HIDDEN_NETWORK: Schema.Boolean,
      IsHotspot: Schema.Boolean,
      ProxyType: Schema.String,
      SSID_STR: Schema.String,
      Password: Optional(Schema.String),
    }),
  ),
)

export type WifiConfig = typeof WifiConfigSchema.Type

export const EthernetConfigSchema = GenericPayloadSchema.pipe(
  Schema.extend(
    Schema.Struct({
      AutoJoin: Schema.Boolean,
      SetupModes: Schema.Array(Schema.String),
      AuthenticationMethod: Schema.String,
      EAPClientConfiguration: EnterpriseClientConfiguration,
      Interface: Schema.Literal("GlobalEthernet"),
    }),
  ),
)

export type EthernetConfig = typeof EthernetConfigSchema.Type
