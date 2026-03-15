import { Context, Effect } from "effect"
import type { AuthenticationError, InternalServerError } from "../../errors/http-errors.js"
import type { Identity } from "../../identity.js"

export const AuthenticationServiceId = "homelab-api/services/authentication-service/AuthenticationService"

export type AuthenticationServiceDef = {
  readonly authenticate: (jwt: Buffer) => Effect.Effect<Identity, AuthenticationError | InternalServerError>
}

export class AuthenticationService
  extends Context.Tag(AuthenticationServiceId)<AuthenticationService, AuthenticationServiceDef>()
{
}

export function authenticate(
  ...params: Parameters<AuthenticationServiceDef["authenticate"]>
): Effect.Effect<Identity, AuthenticationError | InternalServerError, AuthenticationService> {
  return AuthenticationService.pipe(
    Effect.flatMap(
      (_) => _.authenticate(...params),
    ),
  )
}
