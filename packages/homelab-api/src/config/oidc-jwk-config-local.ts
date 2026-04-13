import { FileSystem } from "@effect/platform"
import { Array, Context, Data, Effect, HashMap, Layer, Option, pipe, Record, Schema } from "effect"
import type { JWKs } from "../schemas/OAuth.js"
import { JWKsFromUint8Array } from "../schemas/OAuth.js"
import type { LocalOIDCProviders } from "./oidc-config-local.js"
import { LocalOIDCProviderPathMap } from "./oidc-config-local.js"
import { OIDCIssuerResolver, OIDCIssuerResolverLive } from "./oidc-issuer-resolver.js"

export const LocalOIDCJWKConfigId = "homelab-api/config/oidc-jwk-config-local-jose/LocalOIDCJWKConfig"

export interface LocalOIDCJWKConfigDef {
  getIssuerJwk(key: LocalOIDCProviders): Option.Option<readonly [issuer: string, jwks: JWKs]>
}

export class LocalOIDCJWKConfig extends Context.Tag(LocalOIDCJWKConfigId)<LocalOIDCJWKConfig, LocalOIDCJWKConfigDef>() {
}

export const LocalOIDCJWKConfigLive = Layer.effect(
  LocalOIDCJWKConfig,
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const localFileMaps = yield* LocalOIDCProviderPathMap
    const oidcIssuerResolver = yield* OIDCIssuerResolver

    return yield* pipe(
      localFileMaps,
      Record.map(
        (filePath, oidcConfigKey) =>
          filePath.pipe(
            Option.zipWith(
              Record.get(oidcIssuerResolver, oidcConfigKey),
              Data.tuple,
            ),
          ),
      ),
      Record.toEntries,
      Effect.forEach(
        ([provider, issuerJwk]) =>
          issuerJwk.pipe(
            Option.map(
              ([path, issuer]) =>
                fs.readFile(path).pipe(
                  Effect.andThen(
                    Schema.decode(
                      JWKsFromUint8Array,
                    ),
                  ),
                  Effect.map((jwk) => [issuer, jwk] as const),
                ),
            ),
            Effect.transposeOption,
            Effect.map(
              (issuerJwk) => [provider, issuerJwk] as const,
            ),
          ),
        {
          concurrency: "unbounded",
        },
      ),
      Effect.map(LocalOIDCConfigImpl.from),
    )
  }),
).pipe(
  Layer.provide(
    OIDCIssuerResolverLive,
  ),
)

class LocalOIDCConfigImpl implements LocalOIDCJWKConfigDef {
  static from(...parameters: ConstructorParameters<typeof LocalOIDCConfigImpl>): LocalOIDCConfigImpl {
    return new LocalOIDCConfigImpl(...parameters)
  }

  private readonly issuerJwks: HashMap.HashMap<LocalOIDCProviders, readonly [issuer: string, jwk: JWKs]>

  constructor(
    jwks: ReadonlyArray<readonly [provider: LocalOIDCProviders, Option.Option<readonly [issuer: string, jwk: JWKs]>]>,
  ) {
    this.issuerJwks = pipe(
      jwks,
      Array.filterMap(
        ([provider, issuerJwk]) =>
          issuerJwk.pipe(
            Option.map(
              (issuerJwk) => Data.tuple(provider, issuerJwk),
            ),
          ),
      ),
      HashMap.fromIterable,
    )
  }

  getIssuerJwk(key: LocalOIDCProviders): Option.Option<readonly [issuer: string, jwks: JWKs]> {
    return HashMap.get(this.issuerJwks, key)
  }
}
