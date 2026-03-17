import { Context, Effect } from "effect"
import type { JWTVerifyGetKey } from "jose"
import type { AuthenticationError, InternalServerError } from "../../errors/http-errors.js"
import type { Identity } from "../../identity.js"

export const OIDCAuthenticationServiceId = "homelab-api/services/oidc-authentication-service/OIDCAuthenticationService"

export interface OIDCAuthenticationServiceDef {
  authorizeOIDC(
    jwt: Buffer,
    jwk: JWTVerifyGetKey,
    issuer: string,
  ): Effect.Effect<Identity, AuthenticationError | InternalServerError>
}

export class OIDCAuthenticationService
  extends Context.Tag(OIDCAuthenticationServiceId)<OIDCAuthenticationService, OIDCAuthenticationServiceDef>()
{
}

export function authorizeOIDC(
  ...params: Parameters<OIDCAuthenticationServiceDef["authorizeOIDC"]>
): Effect.Effect<Identity, AuthenticationError | InternalServerError, OIDCAuthenticationService> {
  return OIDCAuthenticationService.pipe(
    Effect.flatMap(
      (_) => _.authorizeOIDC(...params),
    ),
  )
}
