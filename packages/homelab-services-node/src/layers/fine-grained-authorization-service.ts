import { Effect, Layer } from "effect"
import { ApiErrors, ResourceURIs, Services } from "homelab-services"
import type { Identity, Operation } from "homelab-services"

export const FineGrainedAuthorizationServiceLive = Layer.effect(
  Services.FineGrainedAuthorizationService.FineGrainedAuthorizationService,
  Effect.gen(function*() {
    yield* Effect.succeed(false)
    return new FineGrainedAuthorizationServiceImpl()
  }),
)

class FineGrainedAuthorizationServiceImpl
  implements Services.FineGrainedAuthorizationService.FineGrainedAuthorizationServiceDef
{
  refine<E, R>(
    operation: Operation,
    identity: Identity.Identity,
    resource: ResourceURIs.ResourceURIs,
    fgaParams: unknown,
  ): (effect: Effect.Effect<true, E, R>) => Effect.Effect<true, E | ApiErrors.AuthorizationError, R> {
    return Effect.andThen(
      ResourceURIs.match(
        resource,
        fgaParams,
        operation,
        identity,
      )({
        "Config.Wifi": Effect.fn("fga.config.wifi")(function*(params, operation, identity) {
          const wifiParams = params as { payload?: { username?: string } }
          if (wifiParams.payload?.username === "guest") {
            return true as const
          }

          if (wifiParams.payload?.username && identity.principle !== wifiParams.payload.username) {
            return yield* new ApiErrors.AuthorizationError({
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
