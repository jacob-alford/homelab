import { HttpApp, HttpServerResponse } from "@effect/platform"
import { Effect } from "effect"
import type { Homelab } from "homelab-api"
import { handleDns } from "./dns.js"

export const handleDnsDownload = Effect.fn("handleDnsDownload")(
  function*(args: Homelab.MobileConfigEndpoints.DnsDownload.DnsDownloadHandlerArgs) {
    const response = yield* handleDns({ ...args, headers: args.headers })

    yield* HttpApp.appendPreResponseHandler(
      (_, res) =>
        Effect.succeed(
          HttpServerResponse.setHeaders(res, {
            "Content-Disposition": `attachment; filename="dns-${args.path.profile}.mobileconfig"`,
          }),
        ),
    )

    return response
  },
)
