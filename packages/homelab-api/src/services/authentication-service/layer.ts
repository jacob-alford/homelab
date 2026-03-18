import { Effect, flow, Layer, Option } from "effect"
import type { JWTVerifyGetKey } from "jose"
import { decodeJwt } from "jose"
import { JoseJWKCollector, JoseJWKCollectorLive } from "../../config/jwk-collector-jose.js"
import type { AuthenticationError, InternalServerError } from "../../errors/http-errors.js"
import * as ApiErrors from "../../errors/http-errors.js"
import * as Identity from "../../identity.js"
import { OIDCAuthenticationService } from "../oidc-authentication-service/definition.js"
import { OIDCAuthenticationServiceLive } from "../oidc-authentication-service/layer.js"
import type { AuthenticationServiceDef } from "./definition.js"
import { AuthenticationService } from "./definition.js"

export const AuthenticationServiceLive = Layer.effect(
  AuthenticationService,
  Effect.gen(function*() {
    return new AuthenticationServiceImpl(
      yield* OIDCAuthenticationService,
      yield* JoseJWKCollector,
    )
  }),
).pipe(
  Layer.provide(JoseJWKCollectorLive),
  Layer.provide(OIDCAuthenticationServiceLive),
)

class AuthenticationServiceImpl implements AuthenticationServiceDef {
  constructor(
    private readonly oidcService: typeof OIDCAuthenticationService.Service,
    private readonly joseJwkCollector: typeof JoseJWKCollector.Service,
  ) {}

  authenticate(
    jwt: Option.Option<Buffer>,
  ): Effect.Effect<Identity.Identity, AuthenticationError | InternalServerError> {
    return Option.match(
      jwt,
      {
        onNone() {
          return Effect.succeed(new Identity.GuestIdentity())
        },
        onSome: (jwt) =>
          Effect.gen(this, function*() {
            const issuer = yield* this.getJwtIssuer(jwt)
            const jwk = yield* this.getJwk(issuer)

            return yield* this.oidcService.authorizeOIDC(jwt, jwk, issuer)
          }),
      },
    )
  }

  private getJwk(issuer: string): Effect.Effect<JWTVerifyGetKey, ApiErrors.AuthenticationError> {
    return this.joseJwkCollector.getJwkKey(issuer).pipe(
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
