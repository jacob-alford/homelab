import { FetchHttpClient, FileSystem } from "@effect/platform"
import { Context, Effect, HashMap, Layer, type Option, Schema } from "effect"
import type { JWTVerifyGetKey } from "jose"
import { createLocalJWKSet, createRemoteJWKSet, customFetch } from "jose"
import type { JWKs } from "../schemas/OAuth.js"
import { JWKsFromUint8Array } from "../schemas/OAuth.js"
import { fixJwksForJose } from "../utils/fix-jwks-for-jose.js"
import * as Env from "./env.js"
import * as RemoteOIDC from "./oidc-config-remote.js"

export const IssuerJwkResolverId = "homelab-api/config/issuer-jwk-resolver-jose/IssuerJwkResolver"

export interface IssuerJwkResolverDef {
  /** Returns a jose-compatible `JWTVerifyGetKey` for the given issuer URL, or `None` if the issuer is unrecognized. */
  getJwkKey(issuer: string): Option.Option<JWTVerifyGetKey>

  /** Returns the raw JWKs for the given issuer URL, or `None` if the issuer is unrecognized. */
  getJwk(issuer: string): Option.Option<JWKs>
}

/** {@inheritDoc IssuerJwkResolverDef.getJwkKey} */
export function getJwkKey(issuer: string): Effect.Effect<Option.Option<JWTVerifyGetKey>, never, IssuerJwkResolver> {
  return IssuerJwkResolver.pipe(Effect.map((_) => _.getJwkKey(issuer)))
}

/** {@inheritDoc IssuerJwkResolverDef.getJwk} */
export function getJwk(issuer: string): Effect.Effect<Option.Option<JWKs>, never, IssuerJwkResolver> {
  return IssuerJwkResolver.pipe(Effect.map((_) => _.getJwk(issuer)))
}

export class IssuerJwkResolver extends Context.Tag(IssuerJwkResolverId)<IssuerJwkResolver, IssuerJwkResolverDef>() {}

export const IssuerJwkResolverLive = Layer.effect(
  IssuerJwkResolver,
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const origin = yield* Env.originUrl
    const privateKeyPath = yield* Env.tokenIssuerPrivateKeyPath
    const remoteOIDCKanidm = yield* RemoteOIDC.kanidm
    const fetch = yield* FetchHttpClient.Fetch

    const localJwk = yield* fs.readFile(privateKeyPath).pipe(
      Effect.andThen(Schema.decode(JWKsFromUint8Array)),
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

class IssuerJwkResolverImpl implements IssuerJwkResolverDef {
  constructor(
    private readonly jwkKeyMap: HashMap.HashMap<string, JWTVerifyGetKey>,
    private readonly jwkMap: HashMap.HashMap<string, JWKs>,
  ) {}

  getJwkKey(issuer: string): Option.Option<JWTVerifyGetKey> {
    return HashMap.get(this.jwkKeyMap, issuer)
  }

  getJwk(issuer: string): Option.Option<JWKs> {
    return HashMap.get(this.jwkMap, issuer)
  }
}
