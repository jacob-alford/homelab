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

const wifiDownloadUrl = (ssid: string, encryption: "WPA3" | "WPA2") =>
  new URL(`${BASE_URL}/mobile-config/wifi/${ssid}/${encryption}/_download`)

describe("GET /mobile-config/wifi/:ssid/:encryption/_download", () => {
  describe("authorization", () => {
    it.effect("rejects an unauthenticated request", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient
        const result = yield* Effect.flip(
          client["mobile-config"]["wifi-download"]({
            path: { ssid: "test-ssid", encryption: "WPA3" as const },
            urlParams: { password: "pass", disableMACRandomization: false },
          }),
        )
        expect(result._tag).toBe("AuthorizationError")
        expect((result as { resource?: string }).resource).toBe("Config.Wifi")
      }).pipe(Effect.provide(E2ETestLayer)))
  })

  describe("success", () => {
    it.effect("returns wifi profile with Content-Disposition attachment header", () =>
      Effect.gen(function*() {
        const url = wifiDownloadUrl("my-network", "WPA3")
        const { access_token, nonce } = yield* getToken(TEST_API_KEY)

        const response = yield* withAccessTokenAuth(
          access_token,
          nonce,
          url,
          "GET",
          Effect.gen(function*() {
            const httpClient = yield* HttpClient.HttpClient
            return yield* httpClient.execute(
              HttpClientRequest.get(`${url.toString()}?password=secure-pass&disableMACRandomization=false`),
            )
          }),
        )

        expect(response.status).toBe(200)
        const disposition = (response.headers as Record<string, string | undefined>)["content-disposition"]
        expect(disposition).toContain("attachment")
        expect(disposition).toContain("my-network.mobileconfig")
      }).pipe(Effect.provide(E2ETestLayer)))
  })
})
