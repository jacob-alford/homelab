import { FetchHttpClient, FileSystem } from "@effect/platform"
import { Effect, HashMap, Layer, type Option, Schema } from "effect"
import { Config, Schemas, StartupErrors } from "homelab-services"
import type { JWTVerifyGetKey } from "jose"
import { createLocalJWKSet, createRemoteJWKSet, customFetch, flattenedDecrypt } from "jose"
import { fixJwkForJose } from "packages/homelab-services/src/utils/fix-jwks-for-jose.js"
import { ApiKeyConfigLive } from "./api-key-config.js"
import { RemoteOIDCWellKnownDetailsServiceLive } from "./oidc-config-remote.js"

export const IssuerJwkResolverLive = Layer.effect(
  Config.IssuerJwkResolver.IssuerJwkResolver,
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const origin = yield* Config.Env.originUrl
    const privateKeyPath = yield* Config.Env.tokenIssuerPrivateKeyPath
    const privateKeySecretPath = yield* Config.Env.tokenIssuerPrivateKeySecretFile
    const publicKeyPath = yield* Config.Env.tokenIssuerPublicKeyPath
    const remoteOIDCKanidm = yield* Config.OIDCConfigRemote.kanidm
    const fetch = yield* FetchHttpClient.Fetch

    const localPrivateJwkSecret = yield* fs.readFile(privateKeySecretPath)

    const localPrivateJwk = yield* fs.readFile(privateKeyPath).pipe(
      Effect.andThen(Schema.decode(Schemas.OAuth.JWEFromUint8Array)),
      Effect.andThen((localPrivateJwkEnrypted) =>
        Effect.tryPromise({
          try() {
            return flattenedDecrypt(localPrivateJwkEnrypted, localPrivateJwkSecret)
          },
          catch(error) {
            return new StartupErrors.JWKPrivateKeyDecryptionError({ error })
          },
        })
      ),
      Effect.map((_) => _.plaintext),
      Effect.andThen(
        Schema.decode(Schemas.OAuth.JWKFromUint8Array),
      ),
    )

    const localPublicJwk = yield* fs.readFile(publicKeyPath).pipe(
      Effect.andThen(Schema.decode(Schemas.OAuth.JWKFromUint8Array)),
    )

    return new IssuerJwkResolverImpl(
      HashMap.fromIterable([
        [
          remoteOIDCKanidm.issuer,
          createRemoteJWKSet(remoteOIDCKanidm.jwksUri, { [customFetch]: fetch }),
        ],
        [origin.href, createLocalJWKSet({ keys: [fixJwkForJose(localPrivateJwk)] })],
      ]),
      HashMap.fromIterable([
        [origin.href, { keys: [localPublicJwk] }],
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
