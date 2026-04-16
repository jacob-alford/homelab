import { Array, DateTime, Effect, flow, HashSet, Layer, Option, pipe } from "effect"
import { Constants } from "homelab-shared"
import { decodeJwt, importJWK, SignJWT } from "jose"
import * as Crypto from "node:crypto"
import { ApiKeyConfig } from "../../config/api-key-config.js"
import * as Env from "../../config/env.js"
import * as IssuerJwkResolver from "../../config/issuer-jwk-resolver-jose.js"
import * as ApiErrors from "../../errors/http-errors.js"
import type { HTTPMethod } from "../../schemas/HTTPMethod.js"
import type * as OAuth from "../../schemas/OAuth.js"
import { fixJwksForJose } from "../../utils/fix-jwks-for-jose.js"
import { DPoPTokenValidatorService } from "../dpop-token-validator-service/definition.js"
import { NonceService } from "../nonce-service/definition.js"
import type { TokenIssuerServiceDef } from "./definition.js"
import { TokenIssuerService } from "./definition.js"

export const TokenIssuerServiceLive = Layer.effect(
  TokenIssuerService,
  Effect.gen(function*() {
    const origin = yield* Env.originUrl

    const [issuer, jwks] = yield* IssuerJwkResolver.getJwk(origin.href).pipe(
      Effect.andThen(
        Option.match({
          onSome(jwk) {
            return Effect.succeed([origin.href, jwk] as const)
          },
          onNone() {
            return Effect.fail(
              new ApiErrors.InternalServerError({
                message: "Token issuer JWK not found for origin",
              }),
            )
          },
        }),
      ),
    )

    return new TokenIssuerServiceImpl(
      issuer,
      jwks,
      yield* ApiKeyConfig,
      yield* DPoPTokenValidatorService,
      yield* NonceService,
    )
  }),
)

class TokenIssuerServiceImpl implements TokenIssuerServiceDef {
  constructor(
    private readonly oidcIssuer: string,
    private readonly oidcJwk: OAuth.JWKs,
    private readonly apiKeyConfig: typeof ApiKeyConfig.Service,
    private readonly dpopTokenValidator: typeof DPoPTokenValidatorService.Service,
    private readonly nonceService: typeof NonceService.Service,
  ) {}

  issueToken(
    apiKey: Option.Option<string>,
    dpopTokens: ReadonlyArray<string>,
  ) {
    return Effect.gen(this, function*() {
      const apiKeyScopes = yield* this.getApiKeyRoles(apiKey)

      const { htu, htm } = yield* this.extractHtuHtm(dpopTokens)

      const { headers: { jwk } } = yield* this.dpopTokenValidator.validateDPoPToken(
        htu,
        htm,
        dpopTokens,
      )

      const accessToken = yield* this.signAccessToken(jwk, apiKeyScopes)

      const now = yield* DateTime.now
      const nonce = yield* this.nonceService.withTime(now)

      return { accessToken, nonce }
    })
  }

  private extractHtuHtm(dpopTokens: ReadonlyArray<string>) {
    return Array.head(dpopTokens).pipe(
      Option.match({
        onNone: () =>
          Effect.fail(
            new ApiErrors.BadRequest({
              reason: "eap-client-username-required",
              message: "DPoP token is required",
            }),
          ),
        onSome: (token) =>
          Effect.try({
            try: () => {
              const { htm, htu } = decodeJwt(token)
              return { htm: htm as HTTPMethod, htu: new URL(htu as string) }
            },
            catch: (error) =>
              new ApiErrors.AuthenticationError({
                reason: "invalid-credential",
                message: "Failed to decode DPoP token claims",
                error,
              }),
          }),
      }),
    )
  }

  private getApiKeyRoles(apiKey: Option.Option<string>) {
    return Effect.gen(this, function*() {
      const providedApiKey = yield* apiKey.pipe(
        Option.map(Effect.succeed),
        Option.getOrElse(() =>
          Effect.fail(
            new ApiErrors.AuthenticationError({
              reason: "not-authenticated",
              message: "API key is required",
            }),
          )
        ),
      )

      const roles = yield* pipe(
        this.apiKeyConfig.getRoles(providedApiKey),
        Option.map(flow(HashSet.toValues, Effect.succeed)),
        Option.getOrElse(() =>
          Effect.fail(
            new ApiErrors.AuthenticationError({
              reason: "invalid-credential",
              message: "Invalid API key",
            }),
          )
        ),
      )

      return roles.join(",")
    })
  }

  private signAccessToken(dpopJwk: OAuth.JWK, roles: string) {
    return Effect.gen(this, function*() {
      const { keys: [signingKey] } = fixJwksForJose(this.oidcJwk)

      const privateKey = yield* Effect.tryPromise({
        try: () => importJWK(signingKey),
        catch: (error) =>
          new ApiErrors.InternalServerError({
            message: "Failed to import JWK",
            error,
          }),
      })

      const dpopJwkDigest = yield* Effect.try({
        try() {
          return Crypto.hash("sha256", JSON.stringify(dpopJwk))
        },
        catch(error) {
          return new ApiErrors.InternalServerError({
            error,
            message: "Failed to create DPoP thumbprint",
          })
        },
      })

      const nowUnixS = yield* DateTime.now.pipe(
        Effect.map(
          DateTime.toEpochMillis,
        ),
        Effect.map(
          (_) => _ / Constants.MS_PER_S,
        ),
      )

      const expiresIn = Constants.ONE_HOUR_SECONDS

      const jwt = yield* Effect.tryPromise({
        try: () => {
          const jwt = new SignJWT({
            cnf: {
              jkt: dpopJwkDigest,
            },
            [Constants.JWT_ROLES_KEY]: roles,
          })
            .setProtectedHeader({ alg: signingKey.alg!, kid: signingKey.kid! })
            .setIssuedAt(nowUnixS)
            .setIssuer(this.oidcIssuer)
            .setAudience(Constants.JWT_HOMELAB_API_AUD)
            .setExpirationTime(nowUnixS + expiresIn)
            .sign(privateKey)

          return jwt
        },
        catch: (error) =>
          new ApiErrors.InternalServerError({
            message: "Failed to sign JWT",
            error,
          }),
      })

      return jwt
    })
  }
}
