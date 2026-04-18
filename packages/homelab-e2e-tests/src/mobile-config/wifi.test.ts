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

const wifiUrl = (ssid: string, encryption: "WPA3" | "WPA2") =>
  new URL(`${BASE_URL}/mobile-config/wifi/${ssid}/${encryption}`)

describe("PUT /mobile-config/wifi/:ssid/:encryption", () => {
  describe("authorization", () => {
    it.effect("rejects an unauthenticated request", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient
        const result = yield* Effect.flip(
          client["mobile-config"].wifi({
            path: { ssid: "test-ssid", encryption: "WPA3" as const },
            payload: { password: "test-password", disableMACRandomization: false },
          }),
        )
        expect(result._tag).toBe("AuthorizationError")
        expect((result as { resource?: string }).resource).toBe("Config.Wifi")
      }).pipe(Effect.provide(E2ETestLayer)))
  })

  describe("error cases", () => {
    it.effect("rejects EAP-TLS enterprise client type as not implemented", () =>
      Effect.gen(function*() {
        const url = wifiUrl("test-ssid", "WPA3")
        const { access_token, nonce } = yield* getToken(TEST_API_KEY)
        const client = yield* withAccessTokenAuth(access_token, nonce, url, "PUT", makeApiClient)
        const result = yield* Effect.flip(
          client["mobile-config"].wifi({
            path: { ssid: "test-ssid", encryption: "WPA3" as const },
            payload: {
              password: "pass",
              disableMACRandomization: false,
              enterpriseClientType: "EAP-TLS" as const,
            },
          }),
        )
        expect(result._tag).toBe("NotImplemented")
      }).pipe(Effect.provide(E2ETestLayer)))

    it.effect("rejects PEAP enterprise type when username is missing", () =>
      Effect.gen(function*() {
        const url = wifiUrl("test-ssid", "WPA3")
        const { access_token, nonce } = yield* getToken(TEST_API_KEY)
        const client = yield* withAccessTokenAuth(access_token, nonce, url, "PUT", makeApiClient)
        const result = yield* Effect.flip(
          client["mobile-config"].wifi({
            path: { ssid: "test-ssid", encryption: "WPA3" as const },
            payload: {
              password: "pass",
              disableMACRandomization: false,
              enterpriseClientType: "PEAP" as const,
            },
          }),
        )
        expect(result._tag).toBe("BadRequest")
        expect((result as { reason?: string }).reason).toBe("eap-client-username-required")
      }).pipe(Effect.provide(E2ETestLayer)))
  })

  describe("success", () => {
    it.effect("returns a WPA3 personal wifi mobileconfig profile", () =>
      Effect.gen(function*() {
        const url = wifiUrl("my-network", "WPA3")
        const { access_token, nonce } = yield* getToken(TEST_API_KEY)
        const client = yield* withAccessTokenAuth(access_token, nonce, url, "PUT", makeApiClient)
        const result = yield* client["mobile-config"].wifi({
          path: { ssid: "my-network", encryption: "WPA3" as const },
          payload: { password: "secure-pass", disableMACRandomization: false },
        })
        expect(result).toBeDefined()
        expect(typeof result).toBe("string")
      }).pipe(Effect.provide(E2ETestLayer)))
  })
})
