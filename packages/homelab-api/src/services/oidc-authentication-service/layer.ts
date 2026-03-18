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
import type { OIDCAuthenticationServiceDef } from "./definition.js"
import { OIDCAuthenticationService } from "./definition.js"

export const OIDCAuthenticationServiceLive = Layer.effect(
  OIDCAuthenticationService,
  Effect.gen(function*() {
    yield* Effect.succeed(true)
    return new OIDCAuthenticationServiceImpl()
  }),
)

class OIDCAuthenticationServiceImpl implements OIDCAuthenticationServiceDef {
  authorizeOIDC(jwt: Buffer, jwk: JWTVerifyGetKey, issuer: string) {
    return Effect.gen(function*() {
      const rawJwt = yield* Effect.tryPromise({
        try() {
          return jwtVerify(jwt, jwk, {
            audience: Constants.JWT_HOMELAB_API_AUD,
            issuer,
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

      return new Identity.OIDCIdentity(parsedJwt.email, parsedJwt[Constants.JWT_ROLES_KEY])
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
