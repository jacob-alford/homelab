import { FetchHttpClient } from "@effect/platform"
import type { Option } from "effect"
import { Array, Context, Effect, HashMap, Layer } from "effect"
import { Utils } from "homelab-shared"
import type { JSONWebKeySet, JWTVerifyGetKey } from "jose"
import { createLocalJWKSet, createRemoteJWKSet, customFetch } from "jose"
import type { JWKs } from "../schemas/OAuth.js"
import { RemoteOIDCWellKnownDetailsService, RemoteOIDCWellKnownDetailsServiceLive } from "./oidc-config-remote.js"
import { OIDCIssuerResolver, OIDCIssuerResolverLive } from "./oidc-issuer-resolver.js"
import { LocalOIDCJWKConfig } from "./oidc-jwk-config-local.js"

export const JoseJWKCollectorId = "homelab-api/config/jwk-collector-jose/JoseJWKCollector"

export interface JoseJWKCollectorDef {
  getJwkKey(issuer: string): Option.Option<JWTVerifyGetKey>
}

export class JoseJWKCollector extends Context.Tag(JoseJWKCollectorId)<JoseJWKCollector, JoseJWKCollectorDef>() {
}

export const JoseJWKCollectorLive = Layer.effect(
  JoseJWKCollector,
  Effect.gen(function*() {
    const issuerResolver = yield* OIDCIssuerResolver
    const localJwks = yield* LocalOIDCJWKConfig
    const remoteJwkURIs = yield* RemoteOIDCWellKnownDetailsService
    const fetch = yield* FetchHttpClient.Fetch

    return new JoseJWKCollectorImpl(
      HashMap.fromIterable([
        [
          issuerResolver.kanidm,
          createRemoteJWKSet(remoteJwkURIs.kanidm.jwksUri, {
            [customFetch]: fetch,
          }),
        ],
        [issuerResolver.homelab, createLocalJWKSet(fixJwksForJose(localJwks.homelab))],
        [issuerResolver.tests, createLocalJWKSet(fixJwksForJose(localJwks.tests))],
      ]),
    )
  }),
).pipe(
  Layer.provide(RemoteOIDCWellKnownDetailsServiceLive),
  Layer.provide(OIDCIssuerResolverLive),
)

class JoseJWKCollectorImpl implements JoseJWKCollectorDef {
  getJwkKey(issuer: string): Option.Option<JWTVerifyGetKey> {
    return HashMap.get(this.jwkMap, issuer)
  }

  constructor(
    private readonly jwkMap: HashMap.HashMap<string, JWTVerifyGetKey>,
  ) {
  }
}

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
