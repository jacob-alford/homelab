import { HttpApp, HttpServerResponse } from "@effect/platform"
import { Effect } from "effect"
import type { Homelab } from "homelab-api"
import { Middleware, Services } from "homelab-services"
import { generateAcmeProfile } from "./acme.js"

export const handleAcmeDownload = Effect.fn("handleAcmeDownload")(
  function*(args: Homelab.MobileConfigEndpoints.AcmeDownload.AcmeDownloadMobileConfigHandlerArgs) {
    const identity = yield* Middleware.CurrentIdentity
    yield* Services.AuthorizationService.canView(identity, "Config_ACME", args)

    const response = yield* generateAcmeProfile(args)

    yield* HttpApp.appendPreResponseHandler(
      (_, res) =>
        Effect.succeed(
          HttpServerResponse.setHeaders(res, {
            "Content-Disposition": `attachment; filename="acme-${args.path.clientIdentifier}.mobileconfig"`,
          }),
        ),
    )

    return response
  },
)
