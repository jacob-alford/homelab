import { Array, DateTime, Effect, Layer, Option, pipe, Schema } from "effect"
import { ApiErrors, originPathnameEquals, Schemas, Services } from "homelab-services"
import { Constants } from "homelab-shared"
import { decodeJwt, decodeProtectedHeader, jwtVerify } from "jose"
import * as Crypto from "node:crypto"

export const DPoPTokenValidatorServiceLive = Layer.effect(
  Services.DPoPTokenValidatorService.DPoPTokenValidatorService,
  Effect.gen(function*() {
    const nonceService = yield* Services.NonceService.NonceService

    return new DPoPTokenValidatorServiceImpl(nonceService)
  }),
)

class DPoPTokenValidatorServiceImpl implements Services.DPoPTokenValidatorService.DPoPTokenValidatorServiceDef {
  constructor(private readonly nonceService: typeof Services.NonceService.NonceService.Service) {}

  validateDPoPToken(
    expectedHtu: URL,
    expectedHtm: Schemas.HTTPMethod.HTTPMethod,
    dpopTokens: ReadonlyArray<string>,
    accessToken?: string,
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
          new ApiErrors.AuthenticationError({
            reason: "not-authenticated",
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
            Schema.decodeUnknown(Schemas.OAuth.DPoPProofJWT),
          )

          const parsedHeaders = yield* pipe(
            protectedHeader,
            Schema.decodeUnknown(Schemas.OAuth.DPoPJOSEHeader),
          )

          if (parsedToken.htm !== expectedHtm) {
            return yield* new ApiErrors.AuthenticationError({
              reason: "invalid-credential",
              message: "DPoP htm doesn't match",
            })
          }

          if (!originPathnameEquals(parsedToken.htu, expectedHtu)) {
            return yield* new ApiErrors.AuthenticationError({
              reason: "invalid-credential",
              message: "DPoP htu doesn't match",
            })
          }

          yield* this.validateNonce(parsedToken.nonce, requireNonce)

          if (accessToken) {
            yield* this.validateAth(parsedToken.ath, accessToken)
          }

          return {
            headers: parsedHeaders,
            token: parsedToken,
            raw: token,
          } satisfies Services.DPoPTokenValidatorService.DPoPValidationResult
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

  private validateAth(ath: typeof Schemas.OAuth.DPoPProofJWT.Type["ath"], accessToken: string) {
    return Effect.gen(function*() {
      if (ath === undefined) {
        return yield* new ApiErrors.AuthenticationError({
          reason: "invalid-credential",
          message: "access token header missing",
        })
      }

      const atHash = yield* Effect.try({
        try: () => Crypto.createHash("sha256").update(accessToken, "ascii").digest("base64url"),
        catch: (error) =>
          new ApiErrors.InternalServerError({
            message: "failed to hash access token",
            error,
          }),
      })

      if (atHash !== ath) {
        return yield* new ApiErrors.AuthenticationError({
          reason: "invalid-credential",
          message: "access token doesn't match",
        })
      }
    })
  }

  private validateNonce(nonce: typeof Schemas.OAuth.DPoPProofJWT.Type["nonce"], requireNonce: boolean) {
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

      const nonceTime = yield* this.nonceService.validateNonce(nonce).pipe(
        Effect.catchTags({
          NonceValidationError(err) {
            return new ApiErrors.AuthenticationError({
              reason: "signature-validation-failed",
              message: "failed to validate nonce",
              error: err,
            })
          },
          HMACDigestError(err) {
            return new ApiErrors.InternalServerError({
              message: "Error creating HMAC digest",
              error: err,
            })
          },
        }),
      )

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
