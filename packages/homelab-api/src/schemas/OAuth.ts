import { Schema } from "effect"
import { OptionalUnixDateTime } from "./UnixDateTime.js"

import { Constants } from "homelab-shared"
import { Base64Url, OptionalBase64Url } from "./Base64.js"
import { OptionalBufferFromBase64 } from "./Buffer.js"
import * as Crypto from "./Crypto.js"
import { OptionalString, OptionalUrl } from "./optionals.js"
import { ScopeGroupSetSchema } from "./scope-groups.js"

// ----------
// JWSs
// ----------

export const JWSAlgorithms = Schema.Union(
  Crypto.HMACId,
  Crypto.RSADSId,
  Crypto.ECDSAId,
  Schema.Literal("none"),
)

export const JWS = Schema.Struct({
  alg: JWSAlgorithms,
  typ: OptionalString,
  jku: OptionalUrl,
  kid: OptionalString,
  x5u: OptionalUrl,
  x5t: OptionalBase64Url,
})

// ----------
// JWTs
// ----------

export const JWT = Schema.Struct({
  iss: OptionalString,
  sub: OptionalString,
  aud: OptionalString,
  exp: OptionalUnixDateTime,
  nbf: OptionalUnixDateTime,
  iat: OptionalUnixDateTime,
  jti: OptionalString,
})

export const HomelabIdentityJWT = JWT.pipe(
  Schema.extend(
    Schema.Struct({
      [Constants.JWT_ROLES_KEY]: ScopeGroupSetSchema,
      email: Schema.String,
    }),
  ),
)

// ----------
// JWKs
// ----------

export const KeyOps = Schema.Literal(
  "sign",
  "verify",
  "encrypt",
  "decrypt",
  "wrapKey",
  "unwrapKey",
  "deriveKey",
  "deriveBits",
)
  .pipe(Schema.optionalWith({ exact: true }))

export const KeyUse = Schema.Literal("sig", "enc").pipe(Schema.optionalWith({ exact: true }))

export const BaseJWK = Schema.Struct({
  use: KeyUse,
  kid: OptionalString,
  key_ops: KeyOps,
  x5u: OptionalUrl,
  x5c: OptionalBufferFromBase64,
  x5t: OptionalBase64Url,
})

export const ECJWK = Schema.Struct({
  kty: Schema.Literal("EC"),
  alg: Schema.Union(Crypto.ECDSAId, Crypto.PSSDSId),
  crv: Crypto.EllipticCurveId,
  x: Base64Url,
  y: Base64Url,
})

export const RSAJWK = Schema.Struct({
  kty: Schema.Literal("RSA"),
  alg: Schema.Union(Crypto.RSADSId, Crypto.PSSDSId),
  mod: OptionalBase64Url,
  exp: OptionalBase64Url,
})

export const JWK = Schema.Union(
  ECJWK,
  RSAJWK,
)

export const JWKs = Schema.Struct({
  jwks: Schema.NonEmptyArray(JWK),
})
