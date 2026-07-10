import { Effect } from "effect"
import type { Homelab } from "homelab-api"
import { Middleware, Services } from "homelab-services"

export const handleClaimCheck = Effect.fn("handleClaimCheck")(
  function*(args: Homelab.OAuthEndpoints.ClaimCheck.ClaimCheckEndpointHandlerArgs) {
    const identity = yield* Middleware.CurrentIdentity

    yield* Services.AuthorizationService.canCreate(identity, "OAuth_ClaimCheck", args)

    const claimCheck = yield* Services.ClaimCheckService.issue(identity)

    return { claim_check: claimCheck }
  },
  Effect.tapError(Effect.log),
)
