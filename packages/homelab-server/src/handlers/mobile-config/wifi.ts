import { BadRequest, InternalServerError, NotFound, NotImplemented } from "@effect/platform/HttpApiError"
import { Effect } from "effect"
import type { Homelab } from "homelab-api"
import { Services } from "homelab-api"

export const handleWifi = Effect.fn("handleWifi")(
  function*(args: Homelab.Endpoints.Wifi.WifiMobileConfigHandlerArgs) {
    const { encryption, ssid } = args.path
    const { disableMACRandomization, enterpriseClientType, password, username } = args.urlParams

    if (enterpriseClientType === "EAP-TLS") {
      return yield* Effect.fail(
        new NotImplemented(),
      )
    }

    if (!enterpriseClientType) {
      const wifiProfile = yield* Services.WifiProfileGeneratorService.wpaPersonalWifi(
        encryption,
        ssid,
        password,
        disableMACRandomization,
      )

      return yield* Services.XmlPrintingService.printXml(
        wifiProfile,
      )
    }

    if (!username) {
      return yield* Effect.fail(
        new BadRequest(),
      )
    }

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
    XmlPrintingError() {
      return new InternalServerError()
    },
    WifiPayloadGenerationError(err) {
      switch (err.reason) {
        case "ssid-not-found":
          return new NotFound()
        default:
          return new InternalServerError()
      }
    },
  }),
)
