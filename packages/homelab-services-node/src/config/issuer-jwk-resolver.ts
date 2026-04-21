import { FetchHttpClient, FileSystem } from "@effect/platform"
import { Effect, HashMap, Layer, type Option, Schema } from "effect"
import { Config, Schemas, StartupErrors, Utils } from "homelab-services"
import type { JWTVerifyGetKey } from "jose"
import { createLocalJWKSet, createRemoteJWKSet, customFetch, flattenedDecrypt, importJWK } from "jose"
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

    const localPrivateJwkSecret = yield* fs.readFile(privateKeySecretPath).pipe(
      Effect.map(Utils.trimBufferNewlines),
    )

    const localPrivateJwk = yield* fs.readFile(privateKeyPath).pipe(
      Effect.andThen(Schema.decode(Schemas.OAuth.JWEFromUint8Array)),
      Effect.andThen((localPrivateJwkEnrypted) =>
        Effect.tryPromise({
          try() {
            return flattenedDecrypt(
              localPrivateJwkEnrypted,
              localPrivateJwkSecret,
              {
                keyManagementAlgorithms: ["PBES2-HS256+A128KW"],
                maxPBES2Count: 1_000_000,
              },
            )
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

    const localPrivateKey = yield* Effect.tryPromise({
      try() {
        return importJWK(Utils.fixJwkForJose(localPrivateJwk), localPublicJwk.alg, { extractable: false })
      },
      catch(error) {
        return new StartupErrors.JWKPrivateKeyImportError({
          error,
        })
      },
    }).pipe(
      Effect.filterOrDieMessage(
        (key): key is CryptoKey => !(key instanceof Uint8Array),
        "Expected CryptoKey, got Uint8Array",
      ),
    )

    return new IssuerJwkResolverImpl(
      HashMap.fromIterable([
        [
          remoteOIDCKanidm.issuer,
          createRemoteJWKSet(remoteOIDCKanidm.jwksUri, { [customFetch]: fetch }),
        ],
        [origin.href, createLocalJWKSet({ keys: [Utils.fixJwkForJose(localPublicJwk)] })],
      ]),
      HashMap.fromIterable([
        [origin.href, [localPublicJwk, localPrivateKey]],
      ]),
    )
  }),
)

class IssuerJwkResolverImpl implements Config.IssuerJwkResolver.IssuerJwkResolverDef {
  constructor(
    private readonly jwkKeyMap: HashMap.HashMap<string, JWTVerifyGetKey>,
    private readonly jwkMap: HashMap.HashMap<
      string,
      readonly [publicKey: Schemas.OAuth.JWK, privateKey: CryptoKey]
    >,
  ) {}

  isLocalIssuer(issuer: string): boolean {
    return HashMap.has(this.jwkKeyMap, issuer)
  }

  getJwkKeyVerifier(issuer: string): Option.Option<JWTVerifyGetKey> {
    return HashMap.get(this.jwkKeyMap, issuer)
  }

  getJwkKeyPair(issuer: string): Option.Option<readonly [publicKey: Schemas.OAuth.JWK, privateKey: CryptoKey]> {
    return HashMap.get(this.jwkMap, issuer)
  }
}

export const ConfigLive = Layer.mergeAll(
  ApiKeyConfigLive,
  IssuerJwkResolverLive.pipe(Layer.provide(RemoteOIDCWellKnownDetailsServiceLive)),
)
