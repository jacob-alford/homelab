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

const acmeUrl = (clientIdentifier: string) => new URL(`${BASE_URL}/mobile-config/acme/${clientIdentifier}`)

describe("PUT /mobile-config/acme/:clientIdentifier", () => {
  describe("authorization", () => {
    it.effect("rejects an unauthenticated request", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient
        const result = yield* Effect.flip(
          client["mobile-config"].acme({ path: { clientIdentifier: "my-device" } }),
        )
        expect(result._tag).toBe("AuthorizationError")
        expect((result as { resource?: string }).resource).toBe("Config.ACME")
      }).pipe(Effect.provide(E2ETestLayer)))
  })

  describe("error cases", () => {
    it.effect("rejects a blacklisted client identifier", () =>
      Effect.gen(function*() {
        const url = acmeUrl("root")
        const { access_token, nonce } = yield* getToken(TEST_API_KEY)
        const client = yield* withAccessTokenAuth(access_token, nonce, url, "PUT", makeApiClient)
        const result = yield* Effect.flip(
          client["mobile-config"].acme({ path: { clientIdentifier: "root" } }),
        )
        expect(result._tag).toBe("BadRequest")
        expect((result as { reason?: string }).reason).toBe("acme-invalid-client-identifier")
      }).pipe(Effect.provide(E2ETestLayer)))

    it.effect("rejects the blacklisted 'postgres' client identifier", () =>
      Effect.gen(function*() {
        const url = acmeUrl("postgres")
        const { access_token, nonce } = yield* getToken(TEST_API_KEY)
        const client = yield* withAccessTokenAuth(access_token, nonce, url, "PUT", makeApiClient)
        const result = yield* Effect.flip(
          client["mobile-config"].acme({ path: { clientIdentifier: "postgres" } }),
        )
        expect(result._tag).toBe("BadRequest")
        expect((result as { reason?: string }).reason).toBe("acme-invalid-client-identifier")
      }).pipe(Effect.provide(E2ETestLayer)))
  })

  describe("success", () => {
    it.effect("returns an ACME mobileconfig profile for a valid client identifier", () =>
      Effect.gen(function*() {
        const url = acmeUrl("my-device")
        const { access_token, nonce } = yield* getToken(TEST_API_KEY)
        const client = yield* withAccessTokenAuth(access_token, nonce, url, "PUT", makeApiClient)
        const result = yield* client["mobile-config"].acme({ path: { clientIdentifier: "my-device" } })
        expect(result).toBeDefined()
        expect(typeof result).toBe("string")
      }).pipe(Effect.provide(E2ETestLayer)))
  })
})
