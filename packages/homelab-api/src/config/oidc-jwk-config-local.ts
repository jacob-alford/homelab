import { FileSystem } from "@effect/platform"
import { Context, Effect, Layer, pipe, Record, Schema } from "effect"
import type { OIDCProviders } from "../oidc-providers.js"
import type { JWKs } from "../schemas/OAuth.js"
import { JWKsFromUint8Array } from "../schemas/OAuth.js"
import type { LocalOIDCConfig } from "./oidc-config-local.js"
import { LocalOIDCProviderPathMap } from "./oidc-config-local.js"

export const LocalOIDCJWKConfigId = "homelab-api/config/oidc-jwk-config-local-jose/LocalOIDCJWKConfig"

export type LocalOIDCJWKConfigDef = {
  [K in keyof LocalOIDCConfig]: JWKs
}

export class LocalOIDCJWKConfig extends Context.Tag(LocalOIDCJWKConfigId)<LocalOIDCJWKConfig, LocalOIDCJWKConfigDef>() {
}

export const LocalOIDCJWKConfigLive = Layer.effect(
  LocalOIDCJWKConfig,
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const localFileMaps = yield* LocalOIDCProviderPathMap

    return yield* pipe(
      Effect.forEach(
        Record.toEntries(localFileMaps),
        ([provider, path]) =>
          fs.readFile(path).pipe(
            Effect.andThen(
              Schema.decode(
                JWKsFromUint8Array,
              ),
            ),
            Effect.map((_) => [provider, _] as const),
          ),
        {
          concurrency: "unbounded",
        },
      ),
      Effect.map(collectJwks),
    )
  }),
)

function collectJwks(jwks: ReadonlyArray<readonly [OIDCProviders, JWKs]>): LocalOIDCJWKConfigDef {
  return Record.fromEntries(jwks) as LocalOIDCJWKConfigDef
}
