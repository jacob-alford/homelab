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

const HEALTH_URL = new URL(`${BASE_URL}/status/health`)

describe("PUT /status/health", () => {
  describe("authorization", () => {
    it.effect("rejects an unauthenticated request (guest identity lacks permission)", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient
        const result = yield* Effect.flip(client.status.health({}))
        expect(result._tag).toBe("AuthorizationError")
        expect((result as { resource?: string }).resource).toBe("Status.Health")
      }).pipe(Effect.provide(E2ETestLayer)))
  })

  describe("success", () => {
    it.effect("returns health status for an authenticated identity with Status.Health permission", () =>
      Effect.gen(function*() {
        const { access_token, nonce } = yield* getToken(TEST_API_KEY)
        const client = yield* withAccessTokenAuth(access_token, nonce, HEALTH_URL, "PUT", makeApiClient)
        const result = yield* client.status.health({})
        expect(result).toBeDefined()
      }).pipe(Effect.provide(E2ETestLayer)))
  })
})
