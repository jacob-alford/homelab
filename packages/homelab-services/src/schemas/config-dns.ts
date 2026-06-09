import { Schema } from "effect"
import { constFalse } from "effect/Function"
import { Optional, OptionalWithDefault } from "./optionals.js"
import { GenericPayloadSchema } from "./payload-generic.js"

export const DNSSettingsBase = Schema.Struct({
  AllowFailover: OptionalWithDefault(Schema.Boolean, constFalse),
  ServerAddresses: Optional(Schema.Array(Schema.String)),
})

export const DNSSettingsHttps = DNSSettingsBase.pipe(
  Schema.extend(
    Schema.Struct({
      DNSProtocol: Schema.Literal("HTTPS"),
      ServerURL: Schema.URL,
    }),
  ),
)

export const DNSSettingsTLS = DNSSettingsBase.pipe(
  Schema.extend(
    Schema.Struct({
      DNSProtocol: Schema.Literal("TLS"),
      ServerName: Schema.String,
      ServerURL: Optional(Schema.URL),
    }),
  ),
)

export const DNSSettings = Schema.Union(
  DNSSettingsHttps,
  DNSSettingsTLS,
)

export const OnDemandRulesBase = Schema.Struct({
  DNSDomainMatch: Optional(Schema.Array(Schema.URL)),
  DNSServerAddressMatch: Optional(Schema.String),
  InterfaceTypeMatch: Optional(Schema.Literal("Ethernet", "WiFi", "Cellular")),
  SSIDMatch: Optional(Schema.Array(Schema.String)),
  URLStringProbe: Optional(Schema.URL),
})

export const OnDemandRulesConnect = OnDemandRulesBase.pipe(
  Schema.extend(
    Schema.Struct({
      Action: Schema.Literal("Connect"),
    }),
  ),
)

export const OnDemandRulesDisconnect = OnDemandRulesBase.pipe(
  Schema.extend(
    Schema.Struct({
      Action: Schema.Literal("Disconnect"),
    }),
  ),
)

export const OnDemandRulesActionParameters = Schema.Struct({
  DomainAction: Schema.Literal("NeverConnect", "ConnectIfNeeded"),
  Domains: Schema.Array(Schema.URL),
})

export const OnDemandRulesEvaluateConnection = OnDemandRulesBase.pipe(
  Schema.extend(
    Schema.Struct({
      Action: Schema.Literal("EvaluateConnection"),
      ActionParameters: Optional(Schema.Array(OnDemandRulesActionParameters)),
    }),
  ),
)

export const OnDemandRules = Schema.Union(
  OnDemandRulesDisconnect,
  OnDemandRulesConnect,
  OnDemandRulesEvaluateConnection,
)

export const DNSConfigSchema = GenericPayloadSchema.pipe(
  Schema.extend(
    Schema.Struct({
      DNSSettings,
      OnDemandRules: Optional(Schema.Array(OnDemandRules)),
      ProhibitDisablement: OptionalWithDefault(Schema.Boolean, constFalse),
    }),
  ),
)

export type DNSConfig = typeof DNSConfigSchema.Type
