import { Effect, Layer, pipe } from "effect"

import * as ApiErrors from "../../errors/http-errors.js"
import type { Identity } from "../../identity.js"
import { Operation } from "../../operation.js"
import type { Resource } from "../../resource.js"
import { FeatureFlagService } from "../feature-flag-service/index.js"
import type { AuthorizationServiceDef } from "./definition.js"
import { AuthorizationService } from "./definition.js"

export const AuthorizationServiceLive = Layer.effect(
  AuthorizationService,
  Effect.gen(function*() {
    return new AuthorizationServiceImpl(
      yield* FeatureFlagService,
    )
  }),
)

class AuthorizationServiceImpl implements AuthorizationServiceDef {
  constructor(
    private readonly featureFlagService: typeof FeatureFlagService.Service,
  ) {}

  canView(identity: Identity, resource: Resource) {
    return this.hasFeatureFlag(resource, Operation.view).pipe(
      this.authorize(identity, Operation.view, resource),
    )
  }

  canCreate(identity: Identity, resource: Resource) {
    return this.hasFeatureFlag(resource, Operation.create).pipe(
      this.authorize(identity, Operation.create, resource),
    )
  }

  canModify(identity: Identity, resource: Resource) {
    return this.hasFeatureFlag(resource, Operation.modify).pipe(
      this.authorize(identity, Operation.modify, resource),
    )
  }

  canDelete(identity: Identity, resource: Resource) {
    return this.hasFeatureFlag(resource, Operation.delete).pipe(
      this.authorize(identity, Operation.delete, resource),
    )
  }

  private authorize(
    identity: Identity,
    operation: Operation,
    resource: Resource,
  ): <E, R>(effect: Effect.Effect<true, E, R>) => Effect.Effect<true, E | ApiErrors.AuthorizationError, R> {
    return Effect.filterOrFail(
      () => identity.hasPermission(resource) || identity.hasPermission(`${resource}.${operation}`),
      () => ApiErrors.AuthorizationError.fromFGA(identity, operation, resource),
    )
  }

  private hasFeatureFlag(resource: Resource, op: Operation) {
    return pipe(
      true as const,
      Effect.liftPredicate(
        () => this.featureFlagService.enabled(resource, op),
        () => ApiErrors.AuthorizationError.fromFeatureFlag(resource, op),
      ),
    )
  }
}
