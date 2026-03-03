import { Console, Effect, flow, Match } from "effect"
import type { Homelab } from "homelab-api"
import { ApiErrors, Services } from "homelab-api"

const blacklistedAcmeClientIdentifiers = new Set([
  "root",
  "postgres",
])

export const handleAcme = Effect.fn("handleAcme")(
  function*(args: Homelab.MobileConfigEndpoints.Acme.AcmeMobileConfigHandlerArgs) {
    const { clientIdentifier } = args.path

    if (blacklistedAcmeClientIdentifiers.has(clientIdentifier)) {
      return yield* new ApiErrors.BadRequest({
        reason: "acme-invalid-client-identifier",
        message: `Blacklisted client identifier ${clientIdentifier} is not allowed`,
      })
    }

    const acmeProfile = yield* Services.AcmeProfileGeneratorService.acmeProfile(
      clientIdentifier,
    )

    return yield* Services.XmlPrintingService.printXml(
      acmeProfile,
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
