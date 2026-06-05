import { HttpApp, HttpServerResponse } from "@effect/platform"
import { Effect } from "effect"
import type { Homelab } from "homelab-api"
import { Middleware, Services } from "homelab-services"

export const handleRoot = Effect.fn("handleRoot")(
  function*(args: Homelab.CertEndpoints.Root.RootCertHandlerArgs) {
    const identity = yield* Middleware.CurrentIdentity
    yield* Services.AuthorizationService.canView(identity, "Cert_Root", args)

    const certService = yield* Services.CertificateService.CertificateService
    const cert = args.path.format === "der" ? certService.rootCert : certService.rootCrt
    const ext = args.path.format === "der" ? "der" : "crt"

    yield* HttpApp.appendPreResponseHandler(
      (_, res) =>
        Effect.succeed(
          HttpServerResponse.setHeaders(res, {
            "Content-Disposition": `attachment; filename="root-ca.${ext}"`,
          }),
        ),
    )

    return new Uint8Array(cert)
  },
)
