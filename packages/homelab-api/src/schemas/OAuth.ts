import { Schema } from "effect"
import { OptionalUnixDateTime } from "./UnixDateTime.js"

import { Constants } from "homelab-shared"
import { Base64, Base64Url, OptionalBase64Url } from "./Base64.js"
import { StringFromUint8Array } from "./Buffer.js"
import * as Crypto from "./Crypto.js"
import { EnsureArray } from "./EnsureArray.js"
import { Optional, OptionalArray, OptionalString, OptionalUrl } from "./optionals.js"
import { ScopeGroupSetSchema } from "./scope-groups.js"

// ----------
// JWKs
// ----------

export const KeyOp = Schema.Literal(
  "sign",
  "verify",
  "encrypt",
  "decrypt",
  "wrapKey",
  "unwrapKey",
  "deriveKey",
  "deriveBits",
)

export const KeyOps = Optional(EnsureArray(KeyOp))

export const KeyUse = Optional(Schema.Literal("sig", "enc"))

export const BaseJWK = Schema.Struct({
  use: KeyUse,
  kid: OptionalString,
  key_ops: KeyOps,
  x5u: OptionalUrl,
  x5c: OptionalArray(Base64),
  x5t: OptionalBase64Url,
})

export const ECJWK = BaseJWK.pipe(
  Schema.extend(
    Schema.Struct({
      kty: Schema.Literal("EC"),
      alg: Schema.Union(Crypto.ECDSAId, Crypto.PSSDSId),
      crv: Crypto.EllipticCurveId,
      x: Base64Url,
      y: Base64Url,
    }),
  ),
)

export const RSAJWK = BaseJWK.pipe(
  Schema.extend(
    Schema.Struct({
      kty: Schema.Literal("RSA"),
      alg: Schema.Union(Crypto.RSADSId, Crypto.PSSDSId),
      mod: OptionalBase64Url,
      exp: OptionalBase64Url,
    }),
  ),
)

export const JWK = Schema.Union(
  ECJWK,
  RSAJWK,
)

export const OptionalJWK = Optional(JWK)

export type JWK = typeof JWK.Type

export const JWKs = Schema.Struct({
  jwks: Schema.NonEmptyArray(JWK),
})

export type JWKs = typeof JWKs.Type

export const JWKsFromUint8Array = Schema.compose(
  StringFromUint8Array,
  Schema.parseJson(JWKs),
)

// ----------
// JWSs
// ----------

export const AsymmetricJWSAlg = Schema.Union(
  Crypto.RSADSId,
  Crypto.ECDSAId,
)

export const JWSAlgorithms = Schema.Union(
  ...AsymmetricJWSAlg.members,
  Crypto.HMACId,
  Schema.Literal("none"),
)

// ----------
// JWTs
// ----------

export const BaseJOSEHeader = Schema.Struct({
  alg: JWSAlgorithms,
  jwk: JWK,

  jku: OptionalUrl,
  kid: OptionalString,
  x5u: OptionalUrl,
  x5t: OptionalBase64Url,
})

export const DPoPJOSEHeader = BaseJOSEHeader.pipe(
  Schema.omit("alg"),
  Schema.extend(
    Schema.Struct({
      alg: AsymmetricJWSAlg,
      type: Schema.Literal("dpop+jwt"),
    }),
  ),
)

export const BaseJWT = Schema.Struct({
  iss: OptionalString,
  sub: OptionalString,
  aud: OptionalString,
  exp: OptionalUnixDateTime,
  iat: OptionalUnixDateTime,
  jti: OptionalString,
  nbf: OptionalUnixDateTime,
})

export const IdJWT = BaseJWT.pipe(
  Schema.extend(
    Schema.Struct({
      auth_time: OptionalUnixDateTime,
      nonce: OptionalString,
      amr: OptionalString,
      azp: OptionalString,
    }),
  ),
)

export const HomelabIdentityJWT = IdJWT.pipe(
  Schema.extend(
    Schema.Struct({
      [Constants.JWT_ROLES_KEY]: ScopeGroupSetSchema,
      email: Schema.String,
    }),
  ),
)
