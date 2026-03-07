import { Context, Effect } from "effect"
import type { AuthorizationError } from "../../errors/http-errors.js"
import type { Identity } from "../../identity.js"
import type { Operation } from "../../operation.js"
import type { Resource } from "../../resource.js"

export const AuthorizationServiceId = "homelab-api/services/authorization-service/AuthorizationService"

export type AuthorizationServiceDef = {
  +readonly [K in Operation as `can${Capitalize<K>}`]: (
    identity: Identity,
    resource: Resource,
  ) => Effect.Effect<true, AuthorizationError>
}

export class AuthorizationService
  extends Context.Tag(AuthorizationServiceId)<AuthorizationService, AuthorizationServiceDef>()
{
}

export function canView(
  ...params: Parameters<AuthorizationServiceDef["canView"]>
): Effect.Effect<true, AuthorizationError, AuthorizationService> {
  return AuthorizationService.pipe(
    Effect.flatMap(
      (_) => _.canView(...params),
    ),
  )
}

export function canModify(
  ...params: Parameters<AuthorizationServiceDef["canModify"]>
): Effect.Effect<true, AuthorizationError, AuthorizationService> {
  return AuthorizationService.pipe(
    Effect.flatMap(
      (_) => _.canModify(...params),
    ),
  )
}

export function canCreate(
  ...params: Parameters<AuthorizationServiceDef["canCreate"]>
): Effect.Effect<true, AuthorizationError, AuthorizationService> {
  return AuthorizationService.pipe(
    Effect.flatMap(
      (_) => _.canCreate(...params),
    ),
  )
}

export function canDelete(
  ...params: Parameters<AuthorizationServiceDef["canDelete"]>
): Effect.Effect<true, AuthorizationError, AuthorizationService> {
  return AuthorizationService.pipe(
    Effect.flatMap(
      (_) => _.canDelete(...params),
    ),
  )
}
