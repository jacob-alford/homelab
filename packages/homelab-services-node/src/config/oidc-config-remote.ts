import { HttpClient, HttpClientResponse } from "@effect/platform"
import { Effect, Layer } from "effect"
import { Config, Schemas } from "homelab-services"

export const RemoteOIDCWellKnownDetailsServiceLive = Layer.effect(
  Config.OIDCConfigRemote.RemoteOIDCWellKnownDetailsService,
  Effect.gen(function*() {
    const kanidmUrl = yield* Config.Env.kanidmOidcUrl

    const kanidmConfig = yield* HttpClient.get(kanidmUrl).pipe(
      Effect.andThen(
        HttpClientResponse.schemaBodyJson(Schemas.OIDC.OIDCWellKnown),
      ),
    )

    return {
      kanidm: kanidmConfig,
    }
  }),
)
