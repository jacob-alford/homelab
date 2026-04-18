import { HttpClient, HttpClientRequest } from "@effect/platform"
import { describe, expect, it } from "@effect/vitest"
import { Effect } from "effect"
import {
  BASE_URL,
  buildProof,
  E2ETestLayer,
  getToken,
  makeApiClient,
  TEST_API_KEY,
  withAccessTokenAuth,
} from "../../test-utils/index.js"

const TOKEN_URL = new URL(`${BASE_URL}/oauth/token`)

const callTokenEndpoint = (apiKey: string, dpopProof: string) =>
  Effect.gen(function*() {
    const httpClient = yield* HttpClient.HttpClient
    const apiKeyB64 = Buffer.from(`${apiKey}:`).toString("base64")
    return yield* httpClient.execute(
      HttpClientRequest.post(TOKEN_URL.toString()).pipe(
        HttpClientRequest.setHeaders({
          Authorization: `Basic ${apiKeyB64}`,
          DPoP: dpopProof,
        }),
      ),
    )
  })

describe("POST /oauth/token", () => {
  describe("authentication failures", () => {
    it.effect("rejects a request with no API key (no Authorization header)", () =>
      Effect.gen(function*() {
        const dpopProof = yield* buildProof({ htu: TOKEN_URL, htm: "POST" })
        const httpClient = yield* HttpClient.HttpClient
        const response = yield* httpClient.execute(
          HttpClientRequest.post(TOKEN_URL.toString()).pipe(
            HttpClientRequest.setHeaders({ DPoP: dpopProof }),
          ),
        )
        expect(response.status).toBe(401)
        const body = yield* response.json
        expect((body as Record<string, unknown>)["reason"]).toBe("not-authenticated")
      }).pipe(Effect.provide(E2ETestLayer)))

    it.effect("rejects a request with an unrecognized API key", () =>
      Effect.gen(function*() {
        const dpopProof = yield* buildProof({ htu: TOKEN_URL, htm: "POST" })
        const response = yield* callTokenEndpoint("invalid-api-key-xyz", dpopProof)
        expect(response.status).toBe(401)
        const body = yield* response.json
        expect((body as Record<string, unknown>)["reason"]).toBe("invalid-credential")
      }).pipe(Effect.provide(E2ETestLayer)))

    it.effect("rejects a request with no DPoP header", () =>
      Effect.gen(function*() {
        const httpClient = yield* HttpClient.HttpClient
        const apiKeyB64 = Buffer.from(`${TEST_API_KEY}:`).toString("base64")
        const response = yield* httpClient.execute(
          HttpClientRequest.post(TOKEN_URL.toString()).pipe(
            HttpClientRequest.setHeaders({ Authorization: `Basic ${apiKeyB64}` }),
          ),
        )
        expect(response.status).toBe(401)
        const body = yield* response.json
        expect((body as Record<string, unknown>)["reason"]).toBe("not-authenticated")
      }).pipe(Effect.provide(E2ETestLayer)))

    it.effect("rejects a request with a malformed DPoP proof", () =>
      Effect.gen(function*() {
        const response = yield* callTokenEndpoint(TEST_API_KEY, "not-a-jwt")
        expect(response.status).toBe(401)
        const body = yield* response.json
        expect((body as Record<string, unknown>)["reason"]).toBe("invalid-credential")
      }).pipe(Effect.provide(E2ETestLayer)))

    it.effect("rejects a DPoP proof with the wrong htm", () =>
      Effect.gen(function*() {
        const dpopProof = yield* buildProof({ htu: TOKEN_URL, htm: "GET" })
        const response = yield* callTokenEndpoint(TEST_API_KEY, dpopProof)
        expect(response.status).toBe(401)
        const body = yield* response.json
        expect((body as Record<string, unknown>)["reason"]).toBe("invalid-credential")
      }).pipe(Effect.provide(E2ETestLayer)))

    it.effect("rejects a DPoP proof with the wrong htu", () =>
      Effect.gen(function*() {
        const wrongUrl = new URL("https://wrong-server.example.com/oauth/token")
        const dpopProof = yield* buildProof({ htu: wrongUrl, htm: "POST" })
        const response = yield* callTokenEndpoint(TEST_API_KEY, dpopProof)
        expect(response.status).toBe(401)
        const body = yield* response.json
        expect((body as Record<string, unknown>)["reason"]).toBe("invalid-credential")
      }).pipe(Effect.provide(E2ETestLayer)))
  })

  describe("success", () => {
    it.effect("issues a DPoP-bound access token and returns DPoP-Nonce header", () =>
      Effect.gen(function*() {
        const { access_token, nonce, token_type } = yield* getToken(TEST_API_KEY)

        expect(access_token).toBeTypeOf("string")
        expect(access_token.length).toBeGreaterThan(0)
        expect(token_type).toBe("DPoP")
        expect(nonce).toBeTypeOf("string")
        expect(nonce.length).toBeGreaterThan(0)
      }).pipe(Effect.provide(E2ETestLayer)))

    it.effect("issued token is usable for authenticated requests", () =>
      Effect.gen(function*() {
        const { access_token, nonce } = yield* getToken(TEST_API_KEY)
        const certsUrl = new URL(`${BASE_URL}/mobile-config/certs`)

        const client = yield* withAccessTokenAuth(access_token, nonce, certsUrl, "GET", makeApiClient)
        const result = yield* client["mobile-config"].certs({})
        expect(result).toBeDefined()
      }).pipe(Effect.provide(E2ETestLayer)))
  })
})
