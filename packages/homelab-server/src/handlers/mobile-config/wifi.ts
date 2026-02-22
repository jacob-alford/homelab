import { InternalServerError } from "@effect/platform/HttpApiError"
import { Effect } from "effect"
import type { Homelab } from "homelab-api"
import { Services } from "homelab-api"

export const handleWifi = Effect.fn("handleWifi")(
  function*(args: Homelab.Endpoints.Wifi.WifiMobileConfigHandlerArgs) {
    const { ssid } = args.path
    const { disableMACRandomization, password, username } = args.urlParams

    const wifiProfile = yield* Services.WifiProfileGeneratorService.wpa3EnterprisePeapWifi(
      ssid,
      username,
      password,
      disableMACRandomization,
    )

    return yield* Services.XmlPrintingService.printXml(
      wifiProfile,
    )
  },
  Effect.catchTags({
    UuidGenerationError() {
      return new InternalServerError()
    },
    XmlPrintingError() {
      return new InternalServerError()
    },
  }),
)
