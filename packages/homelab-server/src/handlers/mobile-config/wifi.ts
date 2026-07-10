import { Effect, flow, Match, Option, pipe } from "effect"
import type { Homelab } from "homelab-api"
import { ApiErrors, Config, Middleware, Operation, Services } from "homelab-services"
import { match, P } from "ts-pattern"

export const generateWifiProfile = Effect.fn("generateWifiProfile")(
  function*(args: Homelab.MobileConfigEndpoints.Wifi.WifiMobileConfigHandlerArgs) {
    const profile = yield* match(args)
      .with(
        {
          path: {
            ssid: P.select("ssid"),
          },
          payload: {
            enterpriseClientType: "EAP-TLS",
            disableMACRandomization: P.select("disableMACRandomization"),
            includeEthernetProfile: P.select("includeEthernetProfile"),
          },
        },
        ({ disableMACRandomization, includeEthernetProfile, ssid }) =>
          pipe(
            Option.fromNullable(args.headers["x-forwarded-for"]),
            Effect.transposeMapOption(
              Config.SerialNumberConfig.resolveIp,
            ),
            Effect.map(Option.flatten),
            Effect.filterOrElse(
              Option.isSome,
              () =>
                Effect.fail(
                  new ApiErrors.AuthorizationError({
                    resource: "Config_Wifi",
                    operation: Operation.create,
                    message: "Attempting to create EAP-TLS payload from an unrecognized IP address",
                  }),
                ),
            ),
            Effect.andThen(
              ({ value: serialNumber }) =>
                Services.WifiProfileGeneratorService.wpa3EnterpriseEAPTLSWifi(
                  ssid,
                  serialNumber,
                  disableMACRandomization,
                  includeEthernetProfile,
                ),
            ),
          ),
      )
      .with(
        {
          payload: {
            enterpriseClientType: "PEAP",
          },
        },
        ({ path: { ssid }, payload: { disableMACRandomization, includeEthernetProfile, password, username } }) =>
          Services.WifiProfileGeneratorService.wpa3EnterprisePeapWifi(
            ssid,
            username,
            password,
            disableMACRandomization,
            includeEthernetProfile,
          ),
      )
      .otherwise(
        ({ path: { encryption, ssid }, payload: { disableMACRandomization, password } }) =>
          Services.WifiProfileGeneratorService.wpaPersonalWifi(
            encryption,
            ssid,
            password,
            disableMACRandomization,
          ),
      )

    return yield* Services.XmlPrintingService.printXml(
      profile,
    )
  },
  Effect.tapError(Effect.logError),
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
                message: err.error,
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

export const handleWifi = Effect.fn("handleWifi")(
  function*(args: Homelab.MobileConfigEndpoints.Wifi.WifiMobileConfigHandlerArgs) {
    const identity = yield* Middleware.CurrentIdentity
    yield* Services.AuthorizationService.canCreate(identity, "Config_Wifi", args)

    return yield* generateWifiProfile(args)
  },
  Effect.tapError(Effect.logError),
)
