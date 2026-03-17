import { Effect, Layer, Option } from "effect"
import type { JWTVerifyGetKey } from "jose"
import { OIDCIssuerResolver } from "../../config/oidc-issuer-resolver.js"
import { LocalOIDCJWKConfig } from "../../config/oidc-jwk-config-local-jose.js"
import { RemoteOIDCJWKConfig } from "../../config/oidc-jwk-config-remote-jose.js"
import type { AuthenticationError, InternalServerError } from "../../errors/http-errors.js"
import * as Identity from "../../identity.js"
import { isRemoteProvider, type OIDCProviders } from "../../oidc-providers.js"
import { OIDCAuthenticationService } from "../oidc-authentication-service/definition.js"
import type { AuthenticationServiceDef } from "./definition.js"
import { AuthenticationService } from "./definition.js"

export const AuthenticationServiceLive = Layer.effect(
  AuthenticationService,
  Effect.gen(function*() {
    return new AuthenticationServiceImpl(
      yield* OIDCAuthenticationService,
      yield* RemoteOIDCJWKConfig,
      yield* LocalOIDCJWKConfig,
      yield* OIDCIssuerResolver,
    )
  }),
)

class AuthenticationServiceImpl implements AuthenticationServiceDef {
  constructor(
    private readonly oidcService: typeof OIDCAuthenticationService.Service,
    private readonly remoteJwks: typeof RemoteOIDCJWKConfig.Service,
    private readonly localJwks: typeof LocalOIDCJWKConfig.Service,
    private readonly issuerResolver: typeof OIDCIssuerResolver.Service,
  ) {}

  authenticate(
    jwt: Option.Option<Buffer>,
    provider: OIDCProviders,
  ): Effect.Effect<Identity.Identity, AuthenticationError | InternalServerError> {
    const jwk = this.getJwk(provider)

    return Option.match(
      jwt,
      {
        onNone() {
          return Effect.succeed(new Identity.GuestIdentity())
        },
        onSome: (jwt) => {
          return this.oidcService.authorizeOIDC(jwt, jwk, this.issuerResolver[provider])
        },
      },
    )
  }

  private getJwk(provider: OIDCProviders): JWTVerifyGetKey {
    if (isRemoteProvider(provider)) {
      return this.remoteJwks[provider]
    } else {
      return this.localJwks[provider]
    }
  }
}
