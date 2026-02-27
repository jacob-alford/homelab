import { HttpApp, HttpServerResponse } from "@effect/platform"
import { Effect } from "effect"
import type { Homelab } from "homelab-api"
import { handleWifi } from "./wifi.js"

export const handleWifiDownload = Effect.fn("handleWifiDownload")(
  function*(args: Homelab.Endpoints.WifiDownload.WifiMobileConfigDownloadHandlerArgs) {
    const response = yield* handleWifi({
      ...args,
      payload: args.urlParams,
    })

    yield* HttpApp.appendPreResponseHandler(
      (_, res) =>
        Effect.succeed(
          HttpServerResponse.setHeaders(res, {
            "Content-Disposition": `attachment; filename="${args.path.ssid}.mobileconfig"`,
          }),
        ),
    )

    return response
  },
)
