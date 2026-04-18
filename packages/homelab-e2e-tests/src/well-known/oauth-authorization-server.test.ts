import { describe, expect, it } from "@effect/vitest"
import { Effect } from "effect"
import { E2ETestLayer, makeApiClient } from "../../test-utils/index.js"

describe("GET /.well-known/oauth-authorization-server", () => {
  it.effect("returns OAuth 2.0 authorization server metadata without authentication", () =>
    Effect.gen(function*() {
      const client = yield* makeApiClient
      const result = yield* client["well-known"]["well-known-oauth-authorization"]({})
      expect(result.token_endpoint).toBeDefined()
      expect(result.issuer).toBeDefined()
      expect(result.token_endpoint_auth_methods_supported).toContain("client_secret_basic")
      expect(result.grant_types_supported).toContain("client_credentials")
      expect(result.dpop_signing_alg_values_supported).toContain("ES384")
    }).pipe(Effect.provide(E2ETestLayer)))
})
