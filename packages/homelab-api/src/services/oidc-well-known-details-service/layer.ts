import { HttpClient, HttpClientResponse } from "@effect/platform"
import { Effect, Layer, Schema } from "effect"
import { OIDCWellKnown } from "../../schemas/OIDC.js"
import { OIDCWellKnownDetailsService } from "./definition.js"

export const OIDCWellKnownDetailsServiceLive = Layer.effect(
  OIDCWellKnownDetailsService,
  Effect.gen(function*() {
    const oidcWellKnownEndpoint = yield* Schema.Config("OIDC_WELL_KNOWN_URL", Schema.URL)

    return yield* HttpClient.get(oidcWellKnownEndpoint).pipe(
      Effect.andThen(
        HttpClientResponse.schemaBodyJson(OIDCWellKnown),
      ),
    )
  }),
)
