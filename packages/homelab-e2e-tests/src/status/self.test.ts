import { assert, describe, expect, it } from "@effect/vitest"
import { Effect, HashSet, Option } from "effect"
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

const selfUrl = new URL(`${BASE_URL}/status/self`)

describe("GET /status/self", () => {
  describe("authorization", () => {
    it.live("rejects a request with insufficient permissions", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient
        const { access_token, nonce, token_type } = yield* getToken(TEST_LIMITED_API_KEY)
        const dpopProof = yield* createToken({
          htu: selfUrl,
          htm: "GET",
          nonce,
          accessToken: access_token,
        })
        const result = yield* Effect.flip(
          client.status.self({
            headers: {
              dpop: dpopProof,
              authorization: `${token_type} ${access_token}`,
              "x-forwarded-for": "192.168.1.1",
            },
          }),
        )
        assert(
          result instanceof ApiErrors.AuthorizationError,
          `Expected AuthorizationError, got ${JSON.stringify(result)}`,
        )
      }).pipe(Effect.provide(E2ETestLayer)))
  })

  describe("error cases", () => {
    it.live("returns InternalServerError when X-Forwarded-For is missing", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient
        const result = yield* Effect.flip(
          client.status.self({
            headers: {},
          }),
        )
        assert(
          result instanceof ApiErrors.InternalServerError,
          `Expected InternalServerError, got ${JSON.stringify(result)}`,
        )
      }).pipe(Effect.provide(E2ETestLayer)))
  })

  describe("success", () => {
    it.live("returns identity info for guest request", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient
        const result = yield* client.status.self({
          headers: {
            "x-forwarded-for": "192.168.1.1",
          },
        })
        expect(result.principal).toBe("guest")
        expect(result.fullname).toEqual(Option.none())
        expect(result.isTailscale).toBe(false)
        expect(HashSet.size(result.permissions)).toBeGreaterThan(0)
      }).pipe(Effect.provide(E2ETestLayer)))

    it.live("returns isTailscale true for Tailscale IPv4", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient
        const result = yield* client.status.self({
          headers: {
            "x-forwarded-for": "100.64.0.1",
          },
        })
        expect(result.isTailscale).toBe(true)
      }).pipe(Effect.provide(E2ETestLayer)))

    it.live("returns identity info for authenticated request", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient
        const { access_token, nonce, token_type } = yield* getToken(TEST_API_KEY)
        const dpopProof = yield* createToken({
          htu: selfUrl,
          htm: "GET",
          nonce,
          accessToken: access_token,
        })
        const result = yield* client.status.self({
          headers: {
            dpop: dpopProof,
            authorization: `${token_type} ${access_token}`,
            "x-forwarded-for": "192.168.1.1",
          },
        })
        expect(typeof result.principal).toBe("string")
        expect(result.isTailscale).toBe(false)
        expect(HashSet.size(result.permissions)).toBeGreaterThan(0)
      }).pipe(Effect.provide(E2ETestLayer)))
  })
})
