import { describe, expect, it } from "@effect/vitest"
import { Effect, HashSet, Layer } from "effect"
import { Identity, Middleware } from "homelab-api"
import { handleAcmeDownload } from "../../../src/handlers/mobile-config/acme-download.js"
import { generateAcmeProfile } from "../../../src/handlers/mobile-config/acme.js"
import { HandlerTestLayer } from "../../../test-utils/testing-layer.js"

const withIdentity = (identity: Identity.Identity) => Layer.succeed(Middleware.CurrentIdentity, identity)

const downloadArgs = (clientIdentifier = "test-client") => ({
  path: { clientIdentifier },
})

const viewOnlyIdentity = new Identity.OIDCIdentity(
  "user@example.com",
  HashSet.fromIterable(["Config.ACME.view"]),
)

const fullAccessIdentity = new Identity.OIDCIdentity(
  "user@example.com",
  HashSet.fromIterable(["Config.ACME"]),
)

describe("handleAcmeDownload", () => {
  describe("authorization", () => {
    it.effect("should deny access when identity lacks Config.ACME permission", () =>
      Effect.gen(function*() {
        const result = yield* Effect.flip(handleAcmeDownload(downloadArgs()))

        expect(result._tag).toBe("AuthorizationError")
        expect(result.resource).toBe("Config.ACME")
      }).pipe(
        Effect.provide(withIdentity(
          new Identity.OIDCIdentity("user@example.com", HashSet.fromIterable(["Status.Health"])),
        )),
        Effect.provide(HandlerTestLayer),
      ))

    it.effect("should allow view-only permission (does not require create)", () =>
      Effect.gen(function*() {
        const result = yield* handleAcmeDownload(downloadArgs())

        expect(result).toContain("<?xml")
      }).pipe(
        Effect.provide(withIdentity(viewOnlyIdentity)),
        Effect.provide(HandlerTestLayer),
      ))
  })

  describe("happy path", () => {
    it.effect("should generate ACME profile via download", () =>
      Effect.gen(function*() {
        const result = yield* handleAcmeDownload(downloadArgs())

        expect(result).toContain("<?xml")
        expect(result).toContain("plist")
      }).pipe(
        Effect.provide(withIdentity(fullAccessIdentity)),
        Effect.provide(HandlerTestLayer),
      ))
  })
})

describe("generateAcmeProfile (shared logic)", () => {
  it.effect("should generate profile without authorization context", () =>
    Effect.gen(function*() {
      const result = yield* generateAcmeProfile({
        path: { clientIdentifier: "my-device" },
      })

      expect(result).toContain("<?xml")
      expect(result).toContain("my-device")
    }).pipe(
      Effect.provide(HandlerTestLayer),
    ))

  it.effect("should reject blacklisted client identifier", () =>
    Effect.gen(function*() {
      const result = yield* Effect.flip(generateAcmeProfile({
        path: { clientIdentifier: "root" },
      }))

      expect(result._tag).toBe("BadRequest")
      expect(result.reason).toBe("acme-invalid-client-identifier")
    }).pipe(
      Effect.provide(HandlerTestLayer),
    ))
})
