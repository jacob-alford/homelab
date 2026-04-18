import { Schema } from "effect"
import { StringFromUint8Array } from "./Buffer.js"

export const OIDCWellKnownWire = Schema.Struct({
  issuer: Schema.String,
  authorization_endpoint: Schema.String,
  token_endpoint: Schema.String,
  userinfo_endpoint: Schema.String,
  jwks_uri: Schema.URL,
  revocation_endpoint: Schema.URL,
  introspection_endpoint: Schema.URL,
})

export const OIDCWellKnown = OIDCWellKnownWire.pipe(
  Schema.rename({
    authorization_endpoint: "authorizationEndpoint",
    token_endpoint: "tokenEndpoint",
    userinfo_endpoint: "userInfoEndpoint",
    jwks_uri: "jwksUri",
    revocation_endpoint: "revocationEndpoint",
    introspection_endpoint: "introspectionEndpoint",
  }),
)

export type OIDCWellKnown = typeof OIDCWellKnown.Type

export const OIDCWellKnownFromUint8Array = Schema.compose(
  StringFromUint8Array,
  Schema.parseJson(OIDCWellKnown),
)
