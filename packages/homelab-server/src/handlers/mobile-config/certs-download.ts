import { HttpApp, HttpServerResponse } from "@effect/platform"
import { Effect } from "effect"
import type { Homelab } from "homelab-api"
import { handleCerts } from "./certs.js"

export const handleCertsDownload = Effect.fn("handleCertsDownload")(
  function*(args: Homelab.MobileConfigEndpoints.CertsDownload.CertsDownloadHandlerArgs) {
    const response = yield* handleCerts({ ...args, headers: args.headers })

    yield* HttpApp.appendPreResponseHandler(
      (_, res) =>
        Effect.succeed(
          HttpServerResponse.setHeaders(res, {
            "Content-Disposition": `attachment; filename="certs.mobileconfig"`,
          }),
        ),
    )

    return response
  },
)
