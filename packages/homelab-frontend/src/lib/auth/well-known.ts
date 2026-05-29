import { HttpClient, HttpClientRequest, HttpClientResponse } from "@effect/platform"
import { Effect } from "effect"
import { Schemas } from "homelab-services"
import { OIDC_WELL_KNOWN_URL } from "./config.js"

export const fetchOIDCWellKnown = Effect.fn("fetchOIDCWellKnown")(function*() {
  const wellKnownUrl = yield* OIDC_WELL_KNOWN_URL

  const client = (yield* HttpClient.HttpClient).pipe(
    HttpClient.withTracerPropagation(false),
  )
  const response = yield* client.execute(HttpClientRequest.get(wellKnownUrl))
  return yield* HttpClientResponse.schemaBodyJson(Schemas.OIDC.OIDCWellKnown)(response)
})
