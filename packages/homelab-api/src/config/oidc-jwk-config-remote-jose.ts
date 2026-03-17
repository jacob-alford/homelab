import { FetchHttpClient } from "@effect/platform"
import { Context, Effect, Layer } from "effect"
import type { JWTVerifyGetKey } from "jose"
import { createRemoteJWKSet, customFetch } from "jose"
import type { RemoteOIDCConfig } from "./oidc-config-remote.js"
import { RemoteOIDCWellKnownDetailsService, RemoteOIDCWellKnownDetailsServiceLive } from "./oidc-config-remote.js"

export const RemoteOIDCJWKConfigId = "homelab-api/config/oidc-jwk-config-remote-jose/RemoteOIDCJWKConfig"

export type RemoteOIDCJWKConfigDef = {
  [K in keyof RemoteOIDCConfig]: JWTVerifyGetKey
}

export class RemoteOIDCJWKConfig
  extends Context.Tag(RemoteOIDCJWKConfigId)<RemoteOIDCJWKConfig, RemoteOIDCJWKConfigDef>()
{
}

export const RemoteOIDCJWKConfigLive = Layer.effect(
  RemoteOIDCJWKConfig,
  Effect.gen(function*() {
    const oidcConfig = yield* RemoteOIDCWellKnownDetailsService
    const fetch = yield* FetchHttpClient.Fetch

    const kanidmJWK = createRemoteJWKSet(oidcConfig.kanidm.jwksUri, {
      [customFetch]: fetch,
    })

    return {
      kanidm: kanidmJWK,
    }
  }),
).pipe(
  Layer.provide(RemoteOIDCWellKnownDetailsServiceLive),
)
