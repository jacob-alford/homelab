import { Context, Effect } from "effect"
import type { AuthorizationError } from "../../errors/http-errors.js"
import type { Identity } from "../../identity.js"
import type { Operation } from "../../operation.js"
import type { Params, ResourceURIs } from "../../resource-uris.js"

export const AuthorizationServiceId = "homelab-api/services/authorization-service/AuthorizationService"

/**
 * Checks whether an identity is permitted to perform an operation on a resource.
 * @remarks Methods are generated from the `Operation` union as `can${Capitalize<Operation>}` — e.g. `canView`, `canModify`, `canCreate`, `canDelete`. Each fails with `AuthorizationError` if the identity lacks permission.
 */
export type AuthorizationServiceDef = {
  +readonly [K in Operation as `can${Capitalize<K>}`]: <Res extends ResourceURIs>(
    identity: Identity,
    resource: Res,
    params: Params<Res>,
  ) => Effect.Effect<true, AuthorizationError>
}

export class AuthorizationService
  extends Context.Tag(AuthorizationServiceId)<AuthorizationService, AuthorizationServiceDef>()
{
}

/** Checks whether the identity is authorized to view the given resource. */
export function canView(
  ...params: Parameters<AuthorizationServiceDef["canView"]>
): Effect.Effect<true, AuthorizationError, AuthorizationService> {
  return AuthorizationService.pipe(
    Effect.flatMap(
      (_) => _.canView(...params),
    ),
  )
}

/** Checks whether the identity is authorized to modify the given resource. */
export function canModify(
  ...params: Parameters<AuthorizationServiceDef["canModify"]>
): Effect.Effect<true, AuthorizationError, AuthorizationService> {
  return AuthorizationService.pipe(
    Effect.flatMap(
      (_) => _.canModify(...params),
    ),
  )
}

/** Checks whether the identity is authorized to create the given resource. */
export function canCreate(
  ...params: Parameters<AuthorizationServiceDef["canCreate"]>
): Effect.Effect<true, AuthorizationError, AuthorizationService> {
  return AuthorizationService.pipe(
    Effect.flatMap(
      (_) => _.canCreate(...params),
    ),
  )
}

/** Checks whether the identity is authorized to delete the given resource. */
export function canDelete(
  ...params: Parameters<AuthorizationServiceDef["canDelete"]>
): Effect.Effect<true, AuthorizationError, AuthorizationService> {
  return AuthorizationService.pipe(
    Effect.flatMap(
      (_) => _.canDelete(...params),
    ),
  )
}
