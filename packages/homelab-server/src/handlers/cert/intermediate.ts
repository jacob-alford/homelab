import { HttpApp, HttpServerResponse } from "@effect/platform"
import { Effect } from "effect"
import type { Homelab } from "homelab-api"
import { Middleware, Services } from "homelab-services"

export const handleIntermediate = Effect.fn("handleIntermediate")(
  function*(args: Homelab.CertEndpoints.Intermediate.IntermediateCertHandlerArgs) {
    const identity = yield* Middleware.CurrentIdentity
    yield* Services.AuthorizationService.canView(identity, "Cert_Intermediate", args)

    const certService = yield* Services.CertificateService.CertificateService
    const cert = args.path.format === "der" ? certService.intermediateCert : certService.intermediateCrt
    const ext = args.path.format === "der" ? "der" : "crt"

    yield* HttpApp.appendPreResponseHandler(
      (_, res) =>
        Effect.succeed(
          HttpServerResponse.setHeaders(res, {
            "Content-Disposition": `attachment; filename="intermediate-ca.${ext}"`,
          }),
        ),
    )

    return new Uint8Array(cert)
  },
)
