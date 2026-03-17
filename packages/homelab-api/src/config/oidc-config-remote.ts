import { HttpClient, HttpClientResponse } from "@effect/platform"
import { Context, Effect, Layer } from "effect"
import { OIDCWellKnown } from "../schemas/OIDC.js"

export interface RemoteOIDCConfig {
  kanidm: OIDCWellKnown
}

export type RemoteOIDCProviders = keyof RemoteOIDCConfig

export const RemoteOIDCProviderURLMapId = "homelab-api/config/oidc-config-remote/RemoteOIDCProviderURLMap"

export type RemoteOIDCProviderURLMapDef = {
  [K in keyof RemoteOIDCConfig]: URL
}

export class RemoteOIDCProviderURLMap
  extends Context.Tag(RemoteOIDCProviderURLMapId)<RemoteOIDCProviderURLMap, RemoteOIDCProviderURLMapDef>()
{
}

export const RemoteOIDCWellKnownDetailsServiceId =
  "homelab-api/config/oidc-config-remote/RemoteOIDCWellKnownDetailsService"

export class RemoteOIDCWellKnownDetailsService
  extends Context.Tag(RemoteOIDCWellKnownDetailsServiceId)<RemoteOIDCWellKnownDetailsService, RemoteOIDCConfig>()
{
}

export const RemoteOIDCWellKnownDetailsServiceLive = Layer.effect(
  RemoteOIDCWellKnownDetailsService,
  Effect.gen(function*() {
    const urlMap = yield* RemoteOIDCProviderURLMap

    const kanidmConfig = yield* HttpClient.get(urlMap.kanidm).pipe(
      Effect.andThen(
        HttpClientResponse.schemaBodyJson(OIDCWellKnown),
      ),
    )

    return {
      kanidm: kanidmConfig,
    }
  }),
)
