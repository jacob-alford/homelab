import { HttpClient } from "@effect/platform"
import { Effect, Either, Record } from "effect"
import type { Homelab } from "homelab-api"
import { Middleware, Services } from "homelab-services"
import { match, P } from "ts-pattern"

export const handleHealth = Effect.fn("handleHealth")(
  function*(args: Homelab.StatusEndpoints.Health.HealthEndpointHandlerArgs) {
    const identity = yield* Middleware.CurrentIdentity
    yield* Services.AuthorizationService.canView(identity, "Status_Health", args)

    return yield* Effect.all({
      Kanidm: HttpClient.get("https://idm.plato-splunk.media/status"),
      Jellyfin: HttpClient.get("https://jellyfin.plato-splunk.media/health"),
      "Step-CA": HttpClient.get("https://ca.plato-splunk.media/health"),
    }, {
      mode: "either",
    }).pipe(
      Effect.map(
        Record.map(
          Either.match({
            onLeft(err) {
              // see https://github.com/Effect-TS/effect/blob/f7e836ea9b399784fdb3846d176ebe72bb07bfc7/packages/platform/src/internal/httpClient.ts#L825
              return match(err)
                .with({
                  _tag: "ResponseError",
                  response: {
                    status: P.union(408, 429, 500, 502, 503, 504),
                  },
                }, () => "Unreachable" as const)
                .with(
                  {
                    _tag: "RequestError",
                  },
                  () => "Unreachable" as const,
                ).otherwise(
                  () => "Unhealthy" as const,
                )
            },

            onRight(res) {
              return match(res)
                .with({
                  status: P.number.between(200, 299),
                }, () => "Healthy" as const)
                .otherwise(
                  () => "Unhealthy" as const,
                )
            },
          }),
        ),
      ),
    )
  },
)
