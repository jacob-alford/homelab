import { Effect, Layer } from "effect"

import { AuthorizationError } from "../../errors/http-errors.js"
import type { Identity } from "../../identity.js"
import type { Operation } from "../../operation.js"
import * as ResourceURIs from "../../resource-uris.js"
import type { FineGrainedAuthorizationServiceDef } from "./definition.js"
import { FineGrainedAuthorizationService } from "./definition.js"

export const FineGrainedAuthorizationServiceLive = Layer.effect(
  FineGrainedAuthorizationService,
  Effect.gen(function*() {
    yield* Effect.succeed(false)
    return new FineGrainedAuthorizationServiceImpl()
  }),
)

class FineGrainedAuthorizationServiceImpl implements FineGrainedAuthorizationServiceDef {
  refine<Res extends ResourceURIs.ResourceURIs, E, R>(
    operation: Operation,
    identity: Identity,
    resource: Res,
    fgaParams: ResourceURIs.Params<Res>,
  ): (effect: Effect.Effect<true, E, R>) => Effect.Effect<true, E | AuthorizationError, R> {
    return Effect.andThen(
      ResourceURIs.match(
        resource,
        fgaParams,
        operation,
        identity,
      )({
        "Config.Wifi": Effect.fn("fga.config.wifi")(function*(params, operation, identity) {
          if (params.payload.username === "guest") {
            return true as const
          }

          if (params.payload.username && identity.principle !== params.payload.username) {
            return yield* new AuthorizationError({
              resource,
              operation,
              message: `User's principle identifer must match the requested username`,
            })
          }

          return true as const
        }),
        "Config.ACME": () => Effect.succeed(true as const),
        "Config.Certs": () => Effect.succeed(true as const),
        "Status.Health": () => Effect.succeed(true as const),
      }),
    )
  }
}
