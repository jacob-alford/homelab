import { Effect, Layer } from "effect"

import { FetchHttpClient } from "@effect/platform"
import { createRemoteJWKSet, customFetch } from "jose"
import { OIDCWellKnownDetailsService } from "../oidc-well-known-details-service/definition.js"
import type { JoseJWKServiceDef } from "./definition.js"
import { JoseJWKService } from "./definition.js"

export const RemoteJoseJWKServiceLive = Layer.effect(
  JoseJWKService,
  Effect.gen(function*() {
    const oidcConfig = yield* OIDCWellKnownDetailsService

    return new RemoteJoseJWKServiceImpl(
      yield* FetchHttpClient.Fetch,
      oidcConfig.jwksUri,
    )
  }),
)

class RemoteJoseJWKServiceImpl implements JoseJWKServiceDef {
  constructor(
    private readonly fetch: typeof FetchHttpClient.Fetch.Service,
    private readonly jwksUri: URL,
  ) {}

  getJWK() {
    return Effect.succeed(
      createRemoteJWKSet(this.jwksUri, {
        [customFetch]: this.fetch,
      }),
    )
  }
}

export const LocalJoseJWKServiceLive = Layer.effect(
  JoseJWKService,
  Effect.gen(function*() {
    yield* Effect.succeed(true)
    return new LocalJoseJWKServiceImpl()
  }),
)

class LocalJoseJWKServiceImpl implements JoseJWKServiceDef {
  getJWK() {
    return Effect.dieMessage("LocalJoseJWKService.getJWK not implemented")
  }
}
