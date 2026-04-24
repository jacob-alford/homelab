import { FetchHttpClient, FileSystem } from "@effect/platform"
import { Data, Effect, flow, HashMap, Layer, Option, Schema } from "effect"
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

    const localPrivateJwkSecret = yield* privateKeySecretPath.pipe(
      Option.map(
        flow(
          fs.readFile,
          Effect.map(Utils.trimBufferNewlines),
        ),
      ),
      Effect.transposeOption,
    )

    const localPrivateJwk = yield* privateKeyPath.pipe(
      Option.zipWith(localPrivateJwkSecret, Data.tuple),
      Option.map(
        ([privateKeyPath, jwkSecret]) =>
          fs.readFile(privateKeyPath).pipe(
            Effect.andThen(Schema.decode(Schemas.OAuth.JWEFromUint8Array)),
            Effect.andThen((localPrivateJwkEnrypted) =>
              Effect.tryPromise({
                try() {
                  return flattenedDecrypt(
                    localPrivateJwkEnrypted,
                    jwkSecret,
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
          ),
      ),
      Effect.transposeOption,
    )

    const localPublicJwk = yield* publicKeyPath.pipe(
      Option.map(
        flow(
          fs.readFile,
          Effect.andThen(
            Schema.decode(Schemas.OAuth.JWKFromUint8Array),
          ),
        ),
      ),
      Effect.transposeOption,
    )

    const localPrivateKey = yield* localPrivateJwk.pipe(
      Option.zipWith(localPublicJwk, Data.tuple),
      Option.map(
        ([localPrivateJwk, localPublicJwk]) =>
          Effect.tryPromise({
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
          ),
      ),
      Effect.transposeOption,
    )

    const localKeysets: Array<readonly [string, JWTVerifyGetKey]> = localPublicJwk.pipe(
      Option.map(
        (localPublicJwk) => Data.tuple(origin.href, createLocalJWKSet({ keys: [Utils.fixJwkForJose(localPublicJwk)] })),
      ),
      Option.toArray,
    )

    const localKeypairs: Array<readonly [string, readonly [Schemas.OAuth.JWK, CryptoKey]]> = localPublicJwk
      .pipe(
        Option.zipWith(localPrivateKey, Data.tuple),
        Option.map((_) => Data.tuple(origin.href, _)),
        Option.toArray,
      )

    return new IssuerJwkResolverImpl(
      HashMap.fromIterable([
        [
          remoteOIDCKanidm.issuer,
          createRemoteJWKSet(remoteOIDCKanidm.jwksUri, { [customFetch]: fetch }),
        ],
        ...localKeysets,
      ]),
      HashMap.fromIterable([
        ...localKeypairs,
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
