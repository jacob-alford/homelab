import { Effect, Layer, pipe } from "effect"

import * as ApiErrors from "../../errors/http-errors.js"
import type { Identity } from "../../identity.js"
import { Operation } from "../../operation.js"
import type { Params, ResourceURIs } from "../../resource-uris.js"
import { FeatureFlagService } from "../feature-flag-service/index.js"
import { FineGrainedAuthorizationService } from "../fine-grained-authorization-service/definition.js"
import type { AuthorizationServiceDef } from "./definition.js"
import { AuthorizationService } from "./definition.js"

export const AuthorizationServiceLive = Layer.effect(
  AuthorizationService,
  Effect.gen(function*() {
    return new AuthorizationServiceImpl(
      yield* FeatureFlagService,
      yield* FineGrainedAuthorizationService,
    )
  }),
)

class AuthorizationServiceImpl implements AuthorizationServiceDef {
  constructor(
    private readonly featureFlagService: typeof FeatureFlagService.Service,
    private readonly fgaService: typeof FineGrainedAuthorizationService.Service,
  ) {}

  canView<Res extends ResourceURIs>(identity: Identity, resource: Res, params: Params<Res>) {
    return this.hasFeatureFlag(resource, Operation.view).pipe(
      this.authorize(identity, Operation.view, resource),
      this.authorizeFga(identity, Operation.view, resource, params),
    )
  }

  canCreate<Res extends ResourceURIs>(identity: Identity, resource: Res, params: Params<Res>) {
    return this.canView(identity, resource, params).pipe(
      Effect.zipRight(this.hasFeatureFlag(resource, Operation.create)),
      this.authorize(identity, Operation.create, resource),
      this.authorizeFga(identity, Operation.create, resource, params),
    )
  }

  canModify<Res extends ResourceURIs>(identity: Identity, resource: Res, params: Params<Res>) {
    return this.canCreate(identity, resource, params).pipe(
      Effect.zipRight(this.hasFeatureFlag(resource, Operation.modify)),
      this.authorize(identity, Operation.modify, resource),
      this.authorizeFga(identity, Operation.modify, resource, params),
    )
  }

  canDelete<Res extends ResourceURIs>(identity: Identity, resource: Res, params: Params<Res>) {
    return this.canModify(identity, resource, params).pipe(
      Effect.zipRight(this.hasFeatureFlag(resource, Operation.delete)),
      this.authorize(identity, Operation.delete, resource),
      this.authorizeFga(identity, Operation.delete, resource, params),
    )
  }

  private authorize<Res extends ResourceURIs>(
    identity: Identity,
    operation: Operation,
    resource: Res,
  ): <E, R>(effect: Effect.Effect<true, E, R>) => Effect.Effect<true, E | ApiErrors.AuthorizationError, R> {
    return Effect.filterOrFail(
      () => identity.hasPermission(resource) || identity.hasPermission(`${resource}.${operation}`),
      () => ApiErrors.AuthorizationError.fromFGA(identity, operation, resource),
    )
  }

  private authorizeFga<Res extends ResourceURIs>(
    identity: Identity,
    operation: Operation,
    resource: Res,
    params: Params<Res>,
  ): <E, R>(effect: Effect.Effect<true, E, R>) => Effect.Effect<true, E | ApiErrors.AuthorizationError, R> {
    return this.fgaService.refine(operation, identity, resource, params)
  }

  private hasFeatureFlag<Res extends ResourceURIs>(resource: Res, op: Operation) {
    return pipe(
      true as const,
      Effect.liftPredicate(
        () => this.featureFlagService.enabled(resource, op),
        () => ApiErrors.AuthorizationError.fromFeatureFlag(resource, op),
      ),
    )
  }
}
