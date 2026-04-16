import { Context, Effect, pipe } from "effect"
import type { AuthorizationError } from "../../errors/http-errors.js"
import type { Identity } from "../../identity.js"
import type { Operation } from "../../operation.js"
import type { Params, ResourceURIs } from "../../resource-uris.js"

export const FineGrainedAuthorizationServiceId =
  "homelab-api/services/fine-grained-authorization-service/FineGrainedAuthorizationService"

export interface FineGrainedAuthorizationServiceDef {
  /**
   * Returns an effect transformer that applies resource-level authorization checks on top of a coarse-grained allow.
   * @remarks The transformer fails with `AuthorizationError` if the identity is not permitted to perform the operation on the specific resource.
   */
  refine<Res extends ResourceURIs, E, R>(
    operation: Operation,
    identity: Identity,
    resource: Res,
    fgaParams: Params<Res>,
  ): (effect: Effect.Effect<true, E, R>) => Effect.Effect<true, E | AuthorizationError, R>
}

export class FineGrainedAuthorizationService extends Context.Tag(FineGrainedAuthorizationServiceId)<
  FineGrainedAuthorizationService,
  FineGrainedAuthorizationServiceDef
>() {
}

/** {@inheritDoc FineGrainedAuthorizationServiceDef.refine} */
export function refine<Res extends ResourceURIs, E, R>(
  operation: Operation,
  identity: Identity,
  resource: Res,
  fgaParams: Params<Res>,
): (
  effect: Effect.Effect<true, E, R>,
) => Effect.Effect<true, E | AuthorizationError, R | FineGrainedAuthorizationService> {
  return (effect) =>
    FineGrainedAuthorizationService.pipe(
      Effect.flatMap(
        (_) => pipe(effect, _.refine(operation, identity, resource, fgaParams)),
      ),
    )
}
