import { HttpApiError } from "@effect/platform"
import { Console, Effect, flow, identity, Match, pipe } from "effect"
import type { Homelab } from "homelab-api"
import { ApiErrors, Services } from "homelab-api"

export const handleWifi = Effect.fn("handleWifi")(
  function*(args: Homelab.Endpoints.Wifi.WifiMobileConfigHandlerArgs) {
    const { encryption, ssid } = args.path
    const { disableMACRandomization, enterpriseClientType, password, username } = args.payload

    if (enterpriseClientType === "EAP-TLS") {
      return yield* new ApiErrors.NotImplemented({
        message: "EAP-TLS support not implemented",
        internalMethod: "WifiProfileGeneratorService.wpa3EnterpriseEapTLSWifi",
      })
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
      return yield* new ApiErrors.BadRequest({
        message: "Username is required when specifying a PEAP client-type",
        reason: "eap-client-username-required",
      })
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
  Effect.tapError(Console.error),
  Effect.mapError(
    flow(
      Match.value,
      Match.tag("XmlPrintingError", () =>
        new ApiErrors.InternalServerError({
          message: "Error creating PLIST XML",
        })),
      Match.tag(
        "WifiConfigGenerationError",
        (err) => {
          switch (err.reason) {
            case "ssid-not-found":
              return new ApiErrors.NotFound({
                reason: err.reason,
                message: err.message,
              })
            default:
              return new ApiErrors.InternalServerError({
                message: "An unknown error has occured",
              })
          }
        },
      ),
      Match.orElse((_) => _),
    ),
  ),
)
