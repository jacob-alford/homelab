import { describe, expect, it } from "@effect/vitest"
import { Effect, HashSet, Layer } from "effect"
import { Identity, Middleware } from "homelab-services"
import { handleAcme } from "../../../src/handlers/mobile-config/acme.js"
import { HandlerTestLayer } from "../../../test-utils/testing-layer.js"

const withIdentity = (identity: Identity.Identity) => Layer.succeed(Middleware.CurrentIdentity, identity)

const acmeArgs = (clientIdentifier = "test-client") => ({
  path: { clientIdentifier },
})

const authorizedIdentity = new Identity.OIDCIdentity(
  "user@example.com",
  HashSet.fromIterable(["Config.ACME"]),
)

describe("handleAcme", () => {
  describe("authorization", () => {
    it.effect("should deny access when identity lacks Config.ACME permission", () =>
      Effect.gen(function*() {
        const result = yield* Effect.flip(handleAcme(acmeArgs()))

        expect(result._tag).toBe("AuthorizationError")
        expect(result.resource).toBe("Config.ACME")
      }).pipe(
        Effect.provide(withIdentity(
          new Identity.OIDCIdentity("user@example.com", HashSet.fromIterable(["Status.Health"])),
        )),
        Effect.provide(HandlerTestLayer),
      ))

    it.effect("should deny access with empty permissions", () =>
      Effect.gen(function*() {
        const result = yield* Effect.flip(handleAcme(acmeArgs()))

        expect(result._tag).toBe("AuthorizationError")
      }).pipe(
        Effect.provide(withIdentity(
          new Identity.OIDCIdentity("user@example.com", HashSet.fromIterable([])),
        )),
        Effect.provide(HandlerTestLayer),
      ))
  })

  describe("happy path", () => {
    it.effect("should generate ACME profile", () =>
      Effect.gen(function*() {
        const result = yield* handleAcme(acmeArgs())

        expect(result).toContain("<?xml")
        expect(result).toContain("plist")
      }).pipe(
        Effect.provide(withIdentity(authorizedIdentity)),
        Effect.provide(HandlerTestLayer),
      ))

    it.effect("should generate ACME profile with custom client identifier", () =>
      Effect.gen(function*() {
        const result = yield* handleAcme(acmeArgs("my-device"))

        expect(result).toContain("<?xml")
        expect(result).toContain("plist")
        expect(result).toContain("my-device")
      }).pipe(
        Effect.provide(withIdentity(authorizedIdentity)),
        Effect.provide(HandlerTestLayer),
      ))
  })

  describe("internal errors", () => {
    it.effect("should return BadRequest for blacklisted client identifier 'root'", () =>
      Effect.gen(function*() {
        const result = yield* Effect.flip(handleAcme(acmeArgs("root")))

        expect(result._tag).toBe("BadRequest")
        expect(result.reason).toBe("acme-invalid-client-identifier")
      }).pipe(
        Effect.provide(withIdentity(authorizedIdentity)),
        Effect.provide(HandlerTestLayer),
      ))

    it.effect("should return BadRequest for blacklisted client identifier 'postgres'", () =>
      Effect.gen(function*() {
        const result = yield* Effect.flip(handleAcme(acmeArgs("postgres")))

        expect(result._tag).toBe("BadRequest")
        expect(result.reason).toBe("acme-invalid-client-identifier")
      }).pipe(
        Effect.provide(withIdentity(authorizedIdentity)),
        Effect.provide(HandlerTestLayer),
      ))
  })
})
