import { HttpApp, HttpServerResponse } from "@effect/platform"
import { Effect } from "effect"
import type { Homelab } from "homelab-api"
import { Middleware, Services } from "homelab-services"
import { generateWifiProfile } from "./wifi.js"

export const handleWifiDownload = Effect.fn("handleWifiDownload")(
  function*(args: Homelab.MobileConfigEndpoints.WifiDownload.WifiMobileConfigDownloadHandlerArgs) {
    const identity = yield* Middleware.CurrentIdentity

    const wifiArgs = {
      ...args,
      payload: args.urlParams,
    }

    yield* Services.AuthorizationService.canView(identity, "Config_Wifi", wifiArgs)

    const response = yield* generateWifiProfile(wifiArgs)

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
