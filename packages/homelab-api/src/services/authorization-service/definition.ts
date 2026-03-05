import type { Effect } from "effect"
import { Context } from "effect"
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
