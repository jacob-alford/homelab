import { HttpClient, HttpClientRequest } from "@effect/platform"
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

const acmeDownloadUrl = (clientIdentifier: string) =>
  new URL(`${BASE_URL}/mobile-config/acme/${clientIdentifier}/_download`)

describe("GET /mobile-config/acme/:clientIdentifier/_download", () => {
  describe("authorization", () => {
    it.effect("rejects an unauthenticated request", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient
        const result = yield* Effect.flip(
          client["mobile-config"]["acme-download"]({ path: { clientIdentifier: "my-device" } }),
        )
        expect(result._tag).toBe("AuthorizationError")
        expect((result as { resource?: string }).resource).toBe("Config.ACME")
      }).pipe(Effect.provide(E2ETestLayer)))
  })

  describe("success", () => {
    it.effect("returns an ACME profile with Content-Disposition attachment header", () =>
      Effect.gen(function*() {
        const url = acmeDownloadUrl("my-device")
        const { access_token, nonce } = yield* getToken(TEST_API_KEY)

        const response = yield* withAccessTokenAuth(
          access_token,
          nonce,
          url,
          "GET",
          Effect.gen(function*() {
            const httpClient = yield* HttpClient.HttpClient
            return yield* httpClient.execute(HttpClientRequest.get(url.toString()))
          }),
        )

        expect(response.status).toBe(200)
        const disposition = (response.headers as Record<string, string | undefined>)["content-disposition"]
        expect(disposition).toContain("attachment")
        expect(disposition).toContain("my-device.mobileconfig")
      }).pipe(Effect.provide(E2ETestLayer)))
  })
})
