import { describe, expect, it } from "@effect/vitest"
import { Effect } from "effect"
import {
  BASE_URL,
  E2ETestLayer,
  getToken,
  makeApiClient,
  TEST_API_KEY,
  TEST_LIMITED_API_KEY,
  withAccessTokenAuth,
} from "../test-utils/index.js"

describe("authorization", () => {
  it.effect("rejects create permissions when restricted to read permissions", () =>
    Effect.gen(function*() {
      const { access_token, nonce } = yield* getToken(TEST_LIMITED_API_KEY)
      const wifiUrl = new URL(`${BASE_URL}/mobile-config/wifi/test-ssid/WPA3`)

      const client = yield* withAccessTokenAuth(
        access_token,
        nonce,
        wifiUrl,
        "PUT",
        makeApiClient,
      )

      const result = yield* Effect.flip(
        client["mobile-config"].wifi({
          path: { ssid: "test-ssid", encryption: "WPA3" as const },
          payload: { password: "test-password", disableMACRandomization: false },
        }),
      )

      expect(result._tag).toBe("AuthorizationError")
      expect((result as { resource?: string }).resource).toBe("Config.Wifi")
    }).pipe(Effect.provide(E2ETestLayer)))

  it.effect("permits request with sufficient privileges", () =>
    Effect.gen(function*() {
      const { access_token, nonce } = yield* getToken(TEST_API_KEY)
      const certsUrl = new URL(`${BASE_URL}/mobile-config/certs`)

      const client = yield* withAccessTokenAuth(
        access_token,
        nonce,
        certsUrl,
        "GET",
        makeApiClient,
      )

      const result = yield* client["mobile-config"].certs({})
      expect(result).toBeDefined()
    }).pipe(Effect.provide(E2ETestLayer)))
})
