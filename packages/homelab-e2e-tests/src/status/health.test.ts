import { assert, describe, expect, it } from "@effect/vitest"
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

const HEALTH_URL = new URL(`${BASE_URL}/status/health`)

describe("PUT /status/health", () => {
  describe("authorization", () => {
    it.live("rejects guest users", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient

        const result = yield* Effect.flip(
          client.status.health({
            headers: {},
          }),
        )

        assert(result instanceof ApiErrors.AuthorizationError)

        expect(result.message).toBe("guest (Guest) is not allowed to perform view on Status_Health")
      }).pipe(Effect.provide(E2ETestLayer)))
    it.live("rejects a request with a mismathced html", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient

        const dpopProof = yield* createToken({ htu: HEALTH_URL, htm: "POST" })
        const { access_token, token_type } = yield* getToken(TEST_LIMITED_API_KEY)

        const result = yield* Effect.flip(
          client.status.health({
            headers: {
              dpop: dpopProof,
              authorization: `${token_type} ${access_token}`,
            },
          }),
        )

        assert(result instanceof ApiErrors.AuthenticationError)

        expect(result.message).toBe("DPoP htm doesn't match")
      }).pipe(Effect.provide(E2ETestLayer)))

    it.live("rejects an unauthenticated request (guest identity lacks permission)", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient

        const { access_token, nonce, token_type } = yield* getToken(TEST_LIMITED_API_KEY)

        const newDpopProof = yield* createToken({ htu: HEALTH_URL, htm: "PUT", nonce, accessToken: access_token })

        const result = yield* Effect.flip(
          client.status.health({
            headers: {
              dpop: newDpopProof,
              authorization: `${token_type} ${access_token}`,
            },
          }),
        )

        assert(result instanceof ApiErrors.AuthorizationError)

        expect(result.message).toBe(
          "guest-a@a.plato-splunk.media (OIDC) is not allowed to perform view on Status_Health",
        )
      }).pipe(Effect.provide(E2ETestLayer)))
  })

  describe("success", () => {
    it.live("returns health status for an authenticated identity with Status_Health permission", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient

        const { access_token, nonce, token_type } = yield* getToken(TEST_API_KEY)

        const newDpopProof = yield* createToken({ htu: HEALTH_URL, htm: "PUT", nonce, accessToken: access_token })

        const result = yield* client.status.health({
          headers: {
            dpop: newDpopProof,
            authorization: `${token_type} ${access_token}`,
          },
        })

        expect(result).toEqual(
          {
            Jellyfin: "Healthy",
            Kanidm: "Healthy",
            RADIUS: "Healthy",
            "Step-CA": "Healthy",
          },
        )
      }).pipe(Effect.provide(E2ETestLayer)))
  })
})
