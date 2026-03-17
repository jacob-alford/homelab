import { FileSystem } from "@effect/platform"
import { Array, Context, Effect, flow, Layer, pipe, Record, Schema } from "effect"
import { Utils } from "homelab-shared"
import type { JSONWebKeySet, JWTVerifyGetKey } from "jose"
import { createLocalJWKSet } from "jose"
import type { OIDCProviders } from "../oidc-providers.js"
import type { JWKs } from "../schemas/OAuth.js"
import { JWKsFromUint8Array } from "../schemas/OAuth.js"
import type { LocalOIDCConfig } from "./oidc-config-local.js"
import { LocalOIDCProviderPathMap } from "./oidc-config-local.js"

export const LocalOIDCJWKConfigId = "homelab-api/config/oidc-jwk-config-local-jose/LocalOIDCJWKConfig"

export type LocalOIDCJWKConfigDef = {
  [K in keyof LocalOIDCConfig]: JWTVerifyGetKey
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
            Effect.map(flow(fixJwksForJose, createLocalJWKSet)),
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

function fixJwksForJose({ jwks }: JWKs): JSONWebKeySet {
  return Utils.asMutable({
    keys: Array.map(
      jwks,
      ({ x5u, ...rest }) => ({
        ...rest,
        ...(x5u ? { x5u: x5u.toString() } : undefined),
      }),
    ),
  })
}

function collectJwks(jwks: ReadonlyArray<readonly [OIDCProviders, JWTVerifyGetKey]>): LocalOIDCJWKConfigDef {
  return Record.fromEntries(jwks) as LocalOIDCJWKConfigDef
}
