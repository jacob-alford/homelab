import { Effect, flow, Layer, Option } from "effect"
import type { JWTVerifyGetKey } from "jose"
import { decodeJwt } from "jose"
import { IssuerJwkResolver } from "../../config/issuer-jwk-resolver-jose.js"
import type { AuthenticationError, BadRequest, InternalServerError } from "../../errors/http-errors.js"
import * as ApiErrors from "../../errors/http-errors.js"
import * as Identity from "../../identity.js"
import type { HTTPMethod } from "../../schemas/HTTPMethod.js"
import { DPoPTokenValidatorService } from "../dpop-token-validator-service/definition.js"
import type { HMACDigestError } from "../hmac-service/definition.js"
import type { NonceValidationError } from "../nonce-service/definition.js"
import { OIDCAuthenticationService } from "../oidc-authentication-service/definition.js"
import { OIDCAuthenticationServiceLive } from "../oidc-authentication-service/layer.js"
import type { AuthenticationServiceDef } from "./definition.js"
import { AuthenticationService } from "./definition.js"

export const AuthenticationServiceLive = Layer.effect(
  AuthenticationService,
  Effect.gen(function*() {
    return new AuthenticationServiceImpl(
      yield* OIDCAuthenticationService,
      yield* IssuerJwkResolver,
      yield* DPoPTokenValidatorService,
    )
  }),
).pipe(
  Layer.provide(OIDCAuthenticationServiceLive),
)

class AuthenticationServiceImpl implements AuthenticationServiceDef {
  constructor(
    private readonly oidcService: typeof OIDCAuthenticationService.Service,
    private readonly issuerJwkResolver: typeof IssuerJwkResolver.Service,
    private readonly dpopValidator: typeof DPoPTokenValidatorService.Service,
  ) {}

  authenticate(
    jwt: Option.Option<Buffer>,
    expectedHtu: URL,
    expectedHtm: HTTPMethod,
    dpopTokens: ReadonlyArray<string>,
  ): Effect.Effect<
    Identity.Identity,
    AuthenticationError | BadRequest | InternalServerError | NonceValidationError | HMACDigestError
  > {
    return Option.match(
      jwt,
      {
        onNone() {
          return Effect.succeed(new Identity.GuestIdentity())
        },
        onSome: (jwt) =>
          Effect.gen(this, function*() {
            const issuer = yield* this.getJwtIssuer(jwt)
            const jwkKey = yield* this.getJwkKey(issuer)

            const isLocalIssuer = Option.isSome(this.issuerJwkResolver.getJwk(issuer))

            if (isLocalIssuer) {
              yield* this.dpopValidator.validateDPoPToken(
                expectedHtu,
                expectedHtm,
                dpopTokens,
                jwt.toString("utf8"),
                true,
              )
            }

            return yield* this.oidcService.authorizeOIDC(jwt, jwkKey, issuer)
          }),
      },
    )
  }

  private getJwkKey(issuer: string): Effect.Effect<JWTVerifyGetKey, ApiErrors.AuthenticationError> {
    return this.issuerJwkResolver.getJwkKey(issuer).pipe(
      Option.match({
        onNone: () =>
          new ApiErrors.AuthenticationError({
            reason: "unrecognized-issuer",
            message: `Issuer not recognized: ${issuer}`,
          }),
        onSome: Effect.succeed,
      }),
    )
  }

  private getJwtIssuer(jwt: Buffer): Effect.Effect<string, ApiErrors.AuthenticationError> {
    return Effect.try({
      try() {
        const decoded = decodeJwt(jwt.toString("utf8"))

        return decoded.iss
      },
      catch(err) {
        return new ApiErrors.AuthenticationError({
          reason: "invalid-credential",
          message: `Failed to decode JWT: ${err}`,
        })
      },
    }).pipe(
      Effect.andThen(
        flow(
          Effect.fromNullable,
          Effect.mapError(
            () =>
              new ApiErrors.AuthenticationError({
                reason: "invalid-claims",
                message: "JWT is missing issuer claim",
              }),
          ),
        ),
      ),
    )
  }
}
