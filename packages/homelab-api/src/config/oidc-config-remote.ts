import { HttpClient, HttpClientResponse } from "@effect/platform"
import { Context, Effect, Layer } from "effect"
import { OIDCWellKnown } from "../schemas/OIDC.js"
import * as Env from "./env.js"

export interface RemoteOIDCConfig {
  /** The fetched OIDC well-known configuration for the Kanidm identity provider. */
  kanidm: OIDCWellKnown
}

export type RemoteOIDCProviders = keyof RemoteOIDCConfig

export const RemoteOIDCWellKnownDetailsServiceId =
  "homelab-api/config/oidc-config-remote/RemoteOIDCWellKnownDetailsService"

export class RemoteOIDCWellKnownDetailsService
  extends Context.Tag(RemoteOIDCWellKnownDetailsServiceId)<RemoteOIDCWellKnownDetailsService, RemoteOIDCConfig>()
{
}

/** {@inheritDoc RemoteOIDCConfig.kanidm} */
export const kanidm = RemoteOIDCWellKnownDetailsService.pipe(Effect.map((_) => _.kanidm))

export const RemoteOIDCWellKnownDetailsServiceLive = Layer.effect(
  RemoteOIDCWellKnownDetailsService,
  Effect.gen(function*() {
    const kanidmUrl = yield* Env.kanidmOidcUrl

    const kanidmConfig = yield* HttpClient.get(kanidmUrl).pipe(
      Effect.andThen(
        HttpClientResponse.schemaBodyJson(OIDCWellKnown),
      ),
    )

    return {
      kanidm: kanidmConfig,
    }
  }),
)
