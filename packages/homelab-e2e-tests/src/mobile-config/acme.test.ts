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

const acmeUrl = (clientIdentifier: string) => new URL(`${BASE_URL}/mobile-config/acme/${clientIdentifier}`)

describe("PUT /mobile-config/acme/:clientIdentifier", () => {
  describe("authorization", () => {
    it.live("rejects an unauthorized request", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient

        const { access_token, nonce, token_type } = yield* getToken(TEST_LIMITED_API_KEY)

        const newDpopProof = yield* createToken({
          htu: acmeUrl("my-device"),
          htm: "PUT",
          nonce,
          accessToken: access_token,
        })

        const result = yield* Effect.flip(
          client["mobile-config"].acme({
            path: {
              clientIdentifier: "my-device",
            },
            headers: {
              dpop: newDpopProof,
              authorization: `${token_type} ${access_token}`,
            },
          }),
        )

        assert(result instanceof ApiErrors.AuthorizationError)

        expect(result.message).toBe(
          "guest-a@a.plato-splunk.media (OIDC) is not allowed to perform view on Config_ACME",
        )
      }).pipe(Effect.provide(E2ETestLayer)))
  })

  describe("error cases", () => {
    it.live("doesn't allow guests", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient

        const result = yield* Effect.flip(
          client["mobile-config"].acme({
            path: {
              clientIdentifier: "postgres",
            },
            headers: {},
          }),
        )

        assert(result instanceof ApiErrors.AuthorizationError)
        expect(result.message).toBe("guest (Guest) is not allowed to perform view on Config_ACME")
      }).pipe(Effect.provide(E2ETestLayer)))
    it.live("rejects a mismatched DPoP path", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient

        const { access_token, nonce, token_type } = yield* getToken(TEST_API_KEY)

        const newDpopProof = yield* createToken({
          htu: acmeUrl("jacob"),
          htm: "PUT",
          nonce,
          accessToken: access_token,
        })

        const result = yield* Effect.flip(
          client["mobile-config"].acme({
            path: {
              clientIdentifier: "postgres",
            },
            headers: {
              dpop: newDpopProof,
              authorization: `${token_type} ${access_token}`,
            },
          }),
        )

        assert(result instanceof ApiErrors.AuthenticationError)
        expect(result.message).toBe("DPoP htu doesn't match")
      }).pipe(Effect.provide(E2ETestLayer)))

    it.live("rejects a blacklisted client identifier", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient

        const { access_token, nonce, token_type } = yield* getToken(TEST_API_KEY)

        const newDpopProof = yield* createToken({
          htu: acmeUrl("postgres"),
          htm: "PUT",
          nonce,
          accessToken: access_token,
        })

        const result = yield* Effect.flip(
          client["mobile-config"].acme({
            path: {
              clientIdentifier: "postgres",
            },
            headers: {
              dpop: newDpopProof,
              authorization: `${token_type} ${access_token}`,
            },
          }),
        )

        assert(result instanceof ApiErrors.BadRequest)
        expect(result.reason).toBe("acme-invalid-client-identifier")
      }).pipe(Effect.provide(E2ETestLayer)))
  })

  describe("success", () => {
    it.live("returns an ACME mobileconfig profile for a valid client identifier", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient

        const { access_token, nonce, token_type } = yield* getToken(TEST_API_KEY)

        const newDpopProof = yield* createToken({
          htu: acmeUrl("foo"),
          htm: "PUT",
          nonce,
          accessToken: access_token,
        })

        const result = yield* client["mobile-config"].acme({
          path: {
            clientIdentifier: "foo",
          },
          headers: {
            dpop: newDpopProof,
            authorization: `${token_type} ${access_token}`,
          },
        })

        expect(result).toContain("foo")
      }).pipe(Effect.provide(E2ETestLayer)))
  })
})
