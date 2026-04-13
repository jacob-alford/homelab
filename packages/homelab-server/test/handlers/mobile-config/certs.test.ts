import { describe, expect, it } from "@effect/vitest"
import { Effect, HashSet, Layer } from "effect"
import { Identity, Middleware } from "homelab-api"
import { handleCerts } from "../../../src/handlers/mobile-config/certs.js"
import { HandlerTestLayer } from "../../../test-utils/testing-layer.js"

const withIdentity = (identity: Identity.Identity) => Layer.succeed(Middleware.CurrentIdentity, identity)

const authorizedIdentity = new Identity.OIDCIdentity(
  "user@example.com",
  HashSet.fromIterable(["Config.Certs"]),
)

describe("handleCerts", () => {
  describe("authorization", () => {
    it.effect("should deny access when identity lacks Config.Certs permission", () =>
      Effect.gen(function*() {
        const result = yield* Effect.flip(handleCerts({}))

        expect(result._tag).toBe("AuthorizationError")
        expect(result.resource).toBe("Config.Certs")
      }).pipe(
        Effect.provide(withIdentity(
          new Identity.OIDCIdentity("user@example.com", HashSet.fromIterable(["Status.Health"])),
        )),
        Effect.provide(HandlerTestLayer),
      ))

    it.effect("should deny access with empty permissions", () =>
      Effect.gen(function*() {
        const result = yield* Effect.flip(handleCerts({}))

        expect(result._tag).toBe("AuthorizationError")
      }).pipe(
        Effect.provide(withIdentity(
          new Identity.OIDCIdentity("user@example.com", HashSet.fromIterable([])),
        )),
        Effect.provide(HandlerTestLayer),
      ))

    it.effect("should allow guest identity to view certs", () =>
      Effect.gen(function*() {
        const result = yield* handleCerts({})

        expect(result).toContain("<?xml")
        expect(result).toContain("plist")
      }).pipe(
        Effect.provide(withIdentity(new Identity.GuestIdentity())),
        Effect.provide(HandlerTestLayer),
      ))
  })

  describe("happy path", () => {
    it.effect("should generate certificate profile", () =>
      Effect.gen(function*() {
        const result = yield* handleCerts({})

        expect(result).toContain("<?xml")
        expect(result).toContain("plist")
      }).pipe(
        Effect.provide(withIdentity(authorizedIdentity)),
        Effect.provide(HandlerTestLayer),
      ))

    it.effect("should allow mTLS identity with Config.Certs permission", () =>
      Effect.gen(function*() {
        const result = yield* handleCerts({})

        expect(result).toContain("<?xml")
        expect(result).toContain("plist")
      }).pipe(
        Effect.provide(withIdentity(
          new Identity.MTLSIdentity("client.example.com", HashSet.fromIterable(["Config.Certs"])),
        )),
        Effect.provide(HandlerTestLayer),
      ))
  })
})
