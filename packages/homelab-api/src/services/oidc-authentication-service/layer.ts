import { Effect, Layer, pipe, Schema } from "effect"
import type { JWTVerifyGetKey } from "jose"
import { jwtVerify } from "jose"
import {
  JOSEAlgNotAllowed,
  JWSInvalid,
  JWSSignatureVerificationFailed,
  JWTClaimValidationFailed,
  JWTExpired,
  JWTInvalid,
} from "jose/errors"

import { Constants } from "homelab-shared"
import * as ApiErrors from "../../errors/http-errors.js"
import * as Identity from "../../identity.js"
import { HomelabIdentityJWT } from "../../schemas/OAuth.js"
import type { OIDCWellKnown } from "../../schemas/OIDC.js"
import type { AuthenticationServiceDef } from "../authentication-service/definition.js"
import { AuthenticationService } from "../authentication-service/definition.js"
import { JoseJWKService } from "../jose-jwk-service/definition.js"
import { OIDCWellKnownDetailsService } from "../oidc-well-known-details-service/definition.js"

export const OIDCAuthenticationServiceLive = Layer.effect(
  AuthenticationService,
  Effect.gen(function*() {
    const joseJwkService = yield* JoseJWKService

    return new OIDCAuthenticationServiceImpl(
      yield* joseJwkService.getJWK(),
      yield* OIDCWellKnownDetailsService,
    )
  }),
)

class OIDCAuthenticationServiceImpl implements AuthenticationServiceDef {
  constructor(
    private readonly jwk: JWTVerifyGetKey,
    private readonly oidcConfig: OIDCWellKnown,
  ) {}

  authenticate(jwt: Buffer) {
    const jwk = this.jwk
    const oidcIssuer = this.oidcConfig.issuer
    return Effect.gen(function*() {
      const rawJwt = yield* Effect.tryPromise({
        try() {
          return jwtVerify(jwt, jwk, {
            audience: Constants.JWT_HOMELAB_API_AUD,
            issuer: oidcIssuer,
            requiredClaims: ["email", Constants.JWT_ROLES_KEY],
          })
        },
        catch(error) {
          if (error instanceof JWTExpired) {
            return new ApiErrors.AuthenticationError({
              error: error.message,
              reason: "expired-credential",
              message: "Failed to authenticate, recieved expired credential",
            })
          }

          if (error instanceof JWSSignatureVerificationFailed) {
            return new ApiErrors.AuthenticationError({
              error: error.message,
              reason: "signature-validation-failed",
              message: "Failed to authenticate, signature failed verification checks",
            })
          }

          if (error instanceof JWTClaimValidationFailed) {
            return new ApiErrors.AuthenticationError({
              error: error.message,
              reason: "invalid-claims",
              message: "Failed to authenticate, recieved credential with one or more invalid claims",
            })
          }

          if (error instanceof JWTInvalid || error instanceof JWSInvalid || error instanceof JOSEAlgNotAllowed) {
            return new ApiErrors.AuthenticationError({
              error: error.message,
              reason: "invalid-credential",
              message: "Failed to authenticate, recieved invalid JWT",
            })
          }

          return new ApiErrors.InternalServerError({
            message: "Encountered unexpected error: OIDCAuthenticationServiceImpl#authenticate",
            error,
          })
        },
      })

      const parsedJwt = yield* pipe(rawJwt.payload, Schema.decodeUnknown(HomelabIdentityJWT))

      return new Identity.OIDCIdentity(parsedJwt.email, parsedJwt["plato-splunk.jwt.roles"])
    }).pipe(
      Effect.catchTag(
        "ParseError",
        (error) =>
          new ApiErrors.InternalServerError({
            error,
            message: "Encountered unexpected error: OIDCAuthenticationServiceImpl#authenticate",
          }),
      ),
    )
  }
}
