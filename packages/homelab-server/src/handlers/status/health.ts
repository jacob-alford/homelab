import { Effect, Schema } from "effect"
import type { Homelab } from "homelab-api"
import { ApiErrors, Middleware, Schemas, Services } from "homelab-services"

export const handleHealth = Effect.fn("handleHealth")(
  function*(args: Homelab.StatusEndpoints.Health.HealthEndpointHandlerArgs) {
    const identity = yield* Middleware.CurrentIdentity
    yield* Services.AuthorizationService.canView(identity, "Status.Health", args)

    const response = yield* Schema.encode(Schemas.Health.HealthResponseSchema)({
      Jellyfin: "Healthy",
      Kanidm: "Healthy",
      "Step-CA": "Healthy",
      RADIUS: "Healthy",
    })

    return response
  },
  Effect.catchTag(
    "ParseError",
    ApiErrors.HttpApiEncodeError.fromParseError,
  ),
)
