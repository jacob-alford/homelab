import { Effect } from "effect"
import type { Homelab } from "homelab-api"
import { Middleware, Services } from "homelab-services"

export const handleHealth = Effect.fn("handleHealth")(
  function*(args: Homelab.StatusEndpoints.Health.HealthEndpointHandlerArgs) {
    const identity = yield* Middleware.CurrentIdentity

    yield* Services.AuthorizationService.canView(identity, "Status.Health", args)

    return {
      Jellyfin: "Healthy",
      Kanidm: "Healthy",
      "Step-CA": "Healthy",
      RADIUS: "Healthy",
    } as const
  },
)
