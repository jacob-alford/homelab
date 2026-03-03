import { HttpApp, HttpServerResponse } from "@effect/platform"
import { Effect } from "effect"
import type { Homelab } from "homelab-api"
import { handleAcme } from "./acme.js"

export const handleAcmeDownload = Effect.fn("handleAcmeDownload")(
  function*(args: Homelab.MobileConfigEndpoints.AcmeDownload.AcmeDownloadMobileConfigHandlerArgs) {
    const response = yield* handleAcme(args)

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
