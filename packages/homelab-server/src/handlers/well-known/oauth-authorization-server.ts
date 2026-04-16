import { Effect } from "effect"
import type { Homelab } from "homelab-api"
import { Config } from "homelab-api"

export const handleOAuthAuthorizationWellKnown = Effect.fn("handleOAuthAuthorizationWellKnown")(
  function*(args: Homelab.WellKnownEndpoints.OAuthAuthorizationServer.HealthEndpointHandlerArgs) {
    const origin = yield* Config.Env.originUrl

    return {
      issuer: origin,
      token_endpoint: new URL("/oauth/token", origin),
      token_endpoint_auth_methods_supported: ["client_secret_basic"] as const,
      grant_types_supported: ["client_credentials"] as const,
      dpop_signing_alg_values_supported: ["ES384"] as const,
      response_types_supported: [] as const,
    }
  },
)
