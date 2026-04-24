import { describe, expect, it } from "@effect/vitest"
import { Effect } from "effect"
import { ApiErrors } from "homelab-services"
import {
  BASE_URL,
  createToken,
  E2ETestLayer,
  getToken,
  makeApiClient,
  TEST_API_KEY,
  TEST_LIMITED_API_KEY,
} from "../../test-utils/index.js"

export const wifiUrl = (ssid: string, encryption: "WPA3" | "WPA2") =>
  new URL(`${BASE_URL}/mobile-config/wifi/${ssid}/${encryption}`)

describe("PUT /mobile-config/wifi/:ssid/:encryption", () => {
  describe("authorization", () => {
    it.live("rejects an unauthorized request", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient

        const { access_token, nonce, token_type } = yield* getToken(TEST_LIMITED_API_KEY)

        const newDpopProof = yield* createToken({
          htu: wifiUrl("abcd", "WPA2"),
          htm: "PUT",
          nonce,
          accessToken: access_token,
        })

        const result = yield* Effect.flip(
          client["mobile-config"].wifi({
            payload: {
              disableMACRandomization: false,
              password: "1234",
            },
            path: {
              ssid: "abcd",
              encryption: "WPA2",
            },
            headers: {
              dpop: newDpopProof,
              authorization: `${token_type} ${access_token}`,
            },
          }),
        )

        assert(result instanceof ApiErrors.AuthorizationError)

        expect(result.message).toBe(
          "guest-a@a.plato-splunk.media (OIDC) is not allowed to perform view on Config.Wifi",
        )
      }).pipe(Effect.provide(E2ETestLayer)))
  })

  describe("error cases", () => {
    it.live("rejects EAP-TLS enterprise client type as not implemented", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient

        const { access_token, nonce, token_type } = yield* getToken(TEST_API_KEY)

        const newDpopProof = yield* createToken({
          htu: wifiUrl("abcd", "WPA2"),
          htm: "PUT",
          nonce,
          accessToken: access_token,
        })

        const result = yield* Effect.flip(
          client["mobile-config"].wifi({
            payload: {
              disableMACRandomization: false,
              password: "1234",
              enterpriseClientType: "EAP-TLS",
            },
            path: {
              ssid: "abcd",
              encryption: "WPA2",
            },
            headers: {
              dpop: newDpopProof,
              authorization: `${token_type} ${access_token}`,
            },
          }),
        )

        assert(result instanceof ApiErrors.NotImplemented)

        expect(result.message).toBe(
          "EAP-TLS support not implemented",
        )
      }).pipe(Effect.provide(E2ETestLayer)))

    it.live("rejects PEAP enterprise type when username is missing", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient

        const { access_token, nonce, token_type } = yield* getToken(TEST_API_KEY)

        const newDpopProof = yield* createToken({
          htu: wifiUrl("abcd", "WPA2"),
          htm: "PUT",
          nonce,
          accessToken: access_token,
        })

        const result = yield* Effect.flip(
          client["mobile-config"].wifi({
            payload: {
              disableMACRandomization: false,
              password: "1234",
              enterpriseClientType: "PEAP",
            },
            path: {
              ssid: "abcd",
              encryption: "WPA2",
            },
            headers: {
              dpop: newDpopProof,
              authorization: `${token_type} ${access_token}`,
            },
          }),
        )

        assert(result instanceof ApiErrors.BadRequest)

        expect(result.message).toBe(
          "Username is required when specifying a PEAP client-type",
        )
        expect((result as { reason?: string }).reason).toBe("eap-client-username-required")
      }).pipe(Effect.provide(E2ETestLayer)))
    it.live("rejects when username does not match Idenitity", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient

        const { access_token, nonce, token_type } = yield* getToken(TEST_API_KEY)

        const newDpopProof = yield* createToken({
          htu: wifiUrl("abcd", "WPA2"),
          htm: "PUT",
          nonce,
          accessToken: access_token,
        })

        const result = yield* Effect.flip(client["mobile-config"].wifi({
          payload: {
            disableMACRandomization: false,
            password: "1234",
            enterpriseClientType: "PEAP",
            username: "bob",
          },
          path: {
            ssid: "abcd",
            encryption: "WPA2",
          },
          headers: {
            dpop: newDpopProof,
            authorization: `${token_type} ${access_token}`,
          },
        }))

        assert(result instanceof ApiErrors.AuthorizationError)

        expect(result.message).toBe("User's principle identifer must match the requested username")
      }).pipe(Effect.provide(E2ETestLayer)))
  })

  describe("success", () => {
    it.live("returns a WPA3 personal wifi mobileconfig profile", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient

        const { access_token, nonce, token_type } = yield* getToken(TEST_API_KEY)

        const newDpopProof = yield* createToken({
          htu: wifiUrl("0x676179", "WPA2"),
          htm: "PUT",
          nonce,
          accessToken: access_token,
        })

        const result = yield* client["mobile-config"].wifi({
          payload: {
            disableMACRandomization: false,
            password: "1234",
            enterpriseClientType: "PEAP",
            username: "test",
          },
          path: {
            ssid: "0x676179",
            encryption: "WPA2",
          },
          headers: {
            dpop: newDpopProof,
            authorization: `${token_type} ${access_token}`,
          },
        })

        expect(result).toBeDefined()
      }).pipe(Effect.provide(E2ETestLayer)))

    it.live("restricts guest users to guest account", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient

        const result = yield* Effect.flip(client["mobile-config"].wifi({
          payload: {
            disableMACRandomization: false,
            password: "1234",
            enterpriseClientType: "PEAP",
            username: "test",
          },
          path: {
            ssid: "0x676179",
            encryption: "WPA2",
          },
          headers: {},
        }))

        assert(result instanceof ApiErrors.AuthorizationError)
        expect(result.message).toBe("User's principle identifer must match the requested username")
      }).pipe(Effect.provide(E2ETestLayer)))

    it.live("permits guests users to create guest accounts", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient

        const result = yield* client["mobile-config"].wifi({
          payload: {
            disableMACRandomization: false,
            password: "1234",
            enterpriseClientType: "PEAP",
            username: "guest",
          },
          path: {
            ssid: "0x676179",
            encryption: "WPA2",
          },
          headers: {},
        })

        expect(result).toBeDefined()
      }).pipe(Effect.provide(E2ETestLayer)))
  })
})
