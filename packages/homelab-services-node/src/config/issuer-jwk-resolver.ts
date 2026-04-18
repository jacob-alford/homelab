import { FetchHttpClient, FileSystem } from "@effect/platform"
import { Effect, HashMap, Layer, type Option, Schema } from "effect"
import { Config, fixJwksForJose, Schemas } from "homelab-services"
import type { JWTVerifyGetKey } from "jose"
import { createLocalJWKSet, createRemoteJWKSet, customFetch } from "jose"
import { ApiKeyConfigLive } from "./api-key-config.js"
import { RemoteOIDCWellKnownDetailsServiceLive } from "./oidc-config-remote.js"

export const IssuerJwkResolverLive = Layer.effect(
  Config.IssuerJwkResolver.IssuerJwkResolver,
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const origin = yield* Config.Env.originUrl
    const privateKeyPath = yield* Config.Env.tokenIssuerPrivateKeyPath
    const remoteOIDCKanidm = yield* Config.OIDCConfigRemote.kanidm
    const fetch = yield* FetchHttpClient.Fetch

    const localJwk = yield* fs.readFile(privateKeyPath).pipe(
      Effect.andThen(Schema.decode(Schemas.OAuth.JWKsFromUint8Array)),
    )

    return new IssuerJwkResolverImpl(
      HashMap.fromIterable([
        [
          remoteOIDCKanidm.issuer,
          createRemoteJWKSet(remoteOIDCKanidm.jwksUri, { [customFetch]: fetch }),
        ],
        [origin.href, createLocalJWKSet(fixJwksForJose(localJwk))],
      ]),
      HashMap.fromIterable([
        [origin.href, localJwk],
      ]),
    )
  }),
)

class IssuerJwkResolverImpl implements Config.IssuerJwkResolver.IssuerJwkResolverDef {
  constructor(
    private readonly jwkKeyMap: HashMap.HashMap<string, JWTVerifyGetKey>,
    private readonly jwkMap: HashMap.HashMap<string, Schemas.OAuth.JWKs>,
  ) {}

  getJwkKey(issuer: string): Option.Option<JWTVerifyGetKey> {
    return HashMap.get(this.jwkKeyMap, issuer)
  }

  getJwk(issuer: string): Option.Option<Schemas.OAuth.JWKs> {
    return HashMap.get(this.jwkMap, issuer)
  }
}

export const ConfigLive = Layer.mergeAll(
  ApiKeyConfigLive,
  IssuerJwkResolverLive.pipe(Layer.provide(RemoteOIDCWellKnownDetailsServiceLive)),
)
