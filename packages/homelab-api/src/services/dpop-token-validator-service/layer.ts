import { Array, DateTime, Effect, Layer, Option, pipe, Schema } from "effect"
import { Constants } from "homelab-shared"
import { decodeJwt, decodeProtectedHeader, jwtVerify } from "jose"
import * as ApiErrors from "../../errors/http-errors.js"
import type { HTTPMethod } from "../../schemas/HTTPMethod.js"
import * as OAuth from "../../schemas/OAuth.js"
import { originPathnameEquals } from "../../utils/url.js"
import { NonceService } from "../nonce-service/definition.js"
import type { DPoPTokenValidatorServiceDef, DPoPValidationResult } from "./definition.js"
import { DPoPTokenValidatorService } from "./definition.js"

export const DPoPTokenValidatorServiceLive = Layer.effect(
  DPoPTokenValidatorService,
  Effect.gen(function*() {
    const nonceService = yield* NonceService

    return new DPoPTokenValidatorServiceImpl(nonceService)
  }),
)

class DPoPTokenValidatorServiceImpl implements DPoPTokenValidatorServiceDef {
  constructor(private readonly nonceService: typeof NonceService.Service) {}

  validateDPoPToken(
    expectedHtu: URL,
    expectedHtm: HTTPMethod,
    dpopTokens: ReadonlyArray<string>,
    requireNonce = false,
  ) {
    if (dpopTokens.length > 1) {
      return Effect.fail(
        new ApiErrors.AuthenticationError({
          reason: "invalid-credential",
          message: "Received multiple DPoP token headers",
        }),
      )
    }

    return Option.match(Array.head(dpopTokens), {
      onNone() {
        return Effect.fail(
          new ApiErrors.BadRequest({
            reason: "eap-client-username-required",
            message: "DPoP token is required",
          }),
        )
      },
      onSome: Effect.fn(
        function*(this: DPoPTokenValidatorServiceImpl, token) {
          const [, { jwk }] = yield* Effect.try({
            try() {
              return [decodeJwt(token), decodeProtectedHeader(token)] as const
            },
            catch(error) {
              return new ApiErrors.AuthenticationError({
                reason: "invalid-credential",
                message: "Failed to decode DPoP token",
                error,
              })
            },
          })

          if (!jwk) {
            return yield* new ApiErrors.AuthenticationError({
              reason: "invalid-credential",
              message: "DPoP header missing JWK",
            })
          }

          const now = yield* DateTime.nowAsDate

          const { payload, protectedHeader } = yield* Effect.tryPromise({
            try() {
              return jwtVerify(token, jwk, {
                currentDate: now,
                maxTokenAge: Constants.FIVE_MINUTES_SECONDS,
                typ: "dpop+jwt",
              })
            },
            catch(err) {
              return new ApiErrors.AuthenticationError({
                reason: "signature-validation-failed",
                message: "Failed to verify DPoP signature",
                error: err,
              })
            },
          })

          const parsedToken = yield* pipe(
            payload,
            Schema.decodeUnknown(OAuth.DPoPProofJWT),
          )

          const parsedHeaders = yield* pipe(
            protectedHeader,
            Schema.decodeUnknown(OAuth.DPoPJOSEHeader),
          )

          if (parsedToken.htm !== expectedHtm) {
            return yield* new ApiErrors.AuthenticationError({
              reason: "failed-to-verify",
              message: "DPoP htm doesn't match",
            })
          }

          if (!originPathnameEquals(parsedToken.htu, expectedHtu)) {
            return yield* new ApiErrors.AuthenticationError({
              reason: "failed-to-verify",
              message: "DPoP htu doesn't match",
            })
          }

          yield* this.validateNonce(parsedToken.nonce, requireNonce)

          return { headers: parsedHeaders, token: parsedToken, raw: token } satisfies DPoPValidationResult
        },
        Effect.catchTags({
          ParseError(err) {
            return new ApiErrors.AuthenticationError({
              reason: "invalid-credential",
              message: "Invalid DPoP Token",
              error: err,
            })
          },
        }),
      ),
    })
  }

  private validateNonce(nonce: typeof OAuth.DPoPProofJWT.Type["nonce"], requireNonce: boolean) {
    return Effect.gen(this, function*() {
      if (nonce === undefined) {
        if (requireNonce) {
          return yield* new ApiErrors.AuthenticationError({
            reason: "invalid-credential",
            message: "DPoP nonce is required",
          })
        }
        return
      }

      const nonceTime = yield* this.nonceService.validateNonce(nonce)

      const now = yield* DateTime.now
      const nonceExpiry = DateTime.addDuration(nonceTime, "5 minutes")

      if (!DateTime.lessThan(now, nonceExpiry)) {
        return yield* new ApiErrors.AuthenticationError({
          reason: "expired-credential",
          message: "DPoP nonce has expired",
        })
      }
    })
  }
}
