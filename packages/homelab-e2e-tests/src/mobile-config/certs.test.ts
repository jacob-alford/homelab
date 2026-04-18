import { describe, expect, it } from "@effect/vitest"
import { Effect } from "effect"
import {
  BASE_URL,
  E2ETestLayer,
  getToken,
  makeApiClient,
  TEST_API_KEY,
  withAccessTokenAuth,
} from "../../test-utils/index.js"

const CERTS_URL = new URL(`${BASE_URL}/mobile-config/certs`)

describe("GET /mobile-config/certs", () => {
  describe("authorization", () => {
    it.effect("rejects an unauthenticated request", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient
        const result = yield* Effect.flip(client["mobile-config"].certs({}))
        expect(result._tag).toBe("AuthorizationError")
        expect((result as { resource?: string }).resource).toBe("Config.Certs")
      }).pipe(Effect.provide(E2ETestLayer)))
  })

  describe("success", () => {
    it.effect("returns the certificate mobileconfig profile", () =>
      Effect.gen(function*() {
        const { access_token, nonce } = yield* getToken(TEST_API_KEY)
        const client = yield* withAccessTokenAuth(access_token, nonce, CERTS_URL, "GET", makeApiClient)
        const result = yield* client["mobile-config"].certs({})
        expect(result).toBeDefined()
        expect(typeof result).toBe("string")
      }).pipe(Effect.provide(E2ETestLayer)))
  })
})
