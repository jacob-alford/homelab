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

const acmeDownloadUrl = (clientIdentifier: string) =>
  new URL(`${BASE_URL}/mobile-config/acme/${clientIdentifier}/_download`)

describe("GET /mobile-config/acme/:clientIdentifier/_download", () => {
  describe("authorization", () => {
    it.live("doesn't permit guests", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient

        const result = yield* Effect.flip(
          client["mobile-config"]["acme-download"]({
            path: {
              clientIdentifier: "my-device",
            },
            headers: {},
          }),
        )

        assert(result instanceof ApiErrors.AuthorizationError)

        expect(result.message).toBe(
          "guest (Guest) is not allowed to perform view on Config_ACME",
        )
      }).pipe(Effect.provide(E2ETestLayer)))
    it.live("rejects an unauthorized request", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient

        const { access_token, nonce, token_type } = yield* getToken(TEST_LIMITED_API_KEY)

        const newDpopProof = yield* createToken({
          htu: acmeDownloadUrl("my-device"),
          htm: "GET",
          nonce,
          accessToken: access_token,
        })

        const result = yield* Effect.flip(
          client["mobile-config"]["acme-download"]({
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

  describe("success", () => {
    it.live("returns an ACME profile with Content-Disposition attachment header", () =>
      Effect.gen(function*() {
        const client = yield* makeApiClient

        const { access_token, nonce, token_type } = yield* getToken(TEST_API_KEY)

        const newDpopProof = yield* createToken({
          htu: acmeDownloadUrl("my-device"),
          htm: "GET",
          nonce,
          accessToken: access_token,
        })

        const [, res] = yield* client["mobile-config"]["acme-download"]({
          path: {
            clientIdentifier: "my-device",
          },
          withResponse: true,
          headers: {
            dpop: newDpopProof,
            authorization: `${token_type} ${access_token}`,
          },
        })

        const disposition = res.headers["content-disposition"]

        expect(disposition).toContain("attachment")
        expect(disposition).toContain("my-device.mobileconfig")
      }).pipe(Effect.provide(E2ETestLayer)))
  })
})
