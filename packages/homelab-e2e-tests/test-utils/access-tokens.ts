import { HttpClient, HttpClientRequest } from "@effect/platform"
import { Effect, Schema } from "effect"
import { Schemas } from "homelab-services"
import * as Crypto from "node:crypto"
import { BASE_URL } from "./api-client.js"
import { buildProof, type DPoPProofBuilderService } from "./dpop-tokens.js"
import { callWithHeaders } from "./utils.js"

export type GetTokenResult = typeof Schemas.Token.TokenResponse.Type & { readonly nonce: string }

export const getToken = (apiKey: string): Effect.Effect<
  GetTokenResult,
  unknown,
  HttpClient.HttpClient | DPoPProofBuilderService
> =>
  Effect.gen(function*() {
    const tokenUrl = new URL("/oauth/token", BASE_URL)
    const dpopProof = yield* buildProof({ htu: tokenUrl, htm: "POST" })
    const apiKeyB64 = Buffer.from(`${apiKey}:`).toString("base64")

    const httpClient = yield* HttpClient.HttpClient
    const response = yield* httpClient.execute(
      HttpClientRequest.post(tokenUrl.toString()).pipe(
        HttpClientRequest.setHeaders({
          Authorization: `Basic ${apiKeyB64}`,
          DPoP: dpopProof,
        }),
      ),
    )

    const body = yield* response.json
    const tokenResponse = yield* Schema.decodeUnknown(Schemas.Token.TokenResponse)(body)
    const nonceFromHeader = (response.headers as Record<string, string | undefined>)["dpop-nonce"] ?? ""

    return { ...tokenResponse, nonce: nonceFromHeader }
  })

export const makeAccessTokenDPoP = (
  accessToken: string,
  nonce: string,
  htu: URL,
  htm: "GET" | "PUT" | "POST",
): Effect.Effect<string, never, DPoPProofBuilderService> =>
  Effect.gen(function*() {
    const ath = Crypto.createHash("sha256").update(accessToken, "ascii").digest("base64url")
    return yield* buildProof({ htu, htm, nonce, ath })
  })

export const withAccessTokenAuth = <A, E, R>(
  accessToken: string,
  nonce: string,
  htu: URL,
  htm: "GET" | "PUT" | "POST",
  effect: Effect.Effect<A, E, R | HttpClient.HttpClient>,
): Effect.Effect<
  A,
  E,
  R | HttpClient.HttpClient | DPoPProofBuilderService
> =>
  Effect.gen(function*() {
    const dpopProof = yield* makeAccessTokenDPoP(accessToken, nonce, htu, htm)
    return yield* callWithHeaders(
      { Authorization: `DPoP ${accessToken}`, DPoP: dpopProof },
      effect,
    )
  })
