import { Console, Effect, flow, Match } from "effect"
import type { Homelab } from "homelab-api"
import { ApiErrors, Middleware, Services } from "homelab-api"

export const handleCerts = Effect.fn("handleCerts")(
  function*(args: Homelab.MobileConfigEndpoints.Certs.CertsHandlerArgs) {
    const identity = yield* Middleware.CurrentIdentity
    yield* Services.AuthorizationService.canView(identity, "Config.Certs", args)

    const certProfileGenerator = yield* Services.CertProfileGeneratorService.CertProfileService
    const xmlPrintingService = yield* Services.XmlPrintingService.XmlPrintingService

    return yield* xmlPrintingService.printXml(
      yield* certProfileGenerator.certProfile,
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
      Match.orElse((_) => _),
    ),
  ),
)
