import { Effect } from "effect"
import type { Homelab } from "homelab-api"
import { ApiErrors, Middleware, Services } from "homelab-services"

export const handleSelf = Effect.fn("handleSelf")(
  function*(args: Homelab.StatusEndpoints.Self.SelfEndpointHandlerArgs) {
    const identity = yield* Middleware.CurrentIdentity
    yield* Services.AuthorizationService.canView(identity, "Status_Self", args)

    const xForwardedFor = args.headers["x-forwarded-for"]
    if (!xForwardedFor) {
      return yield* new ApiErrors.InternalServerError({
        message: "missing X-Forwarded-For header",
      })
    }

    const isTailscale = xForwardedFor.startsWith("100.")
      || xForwardedFor.startsWith("fd7a:115c:a1e0")

    return {
      isTailscale,
      permissions: identity.permissionSet,
      principal: identity.principle,
      fullname: identity.fullname,
    }
  },
)
