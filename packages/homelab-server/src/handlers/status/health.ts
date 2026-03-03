import { Effect, Schema } from "effect"
import type { Homelab } from "homelab-api"
import { ApiErrors, Schemas } from "homelab-api"

export const handleHealth = Effect.fn("handleHealth")(
  function*(_args: Homelab.StatusEndpoints.Health.HealthEndpointHandlerArgs) {
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
