import { assert, describe, expect, it } from "@effect/vitest"
import { Effect, HashSet, Layer } from "effect"
import { type Homelab } from "homelab-api"
import { ApiErrors, Identity, Middleware } from "homelab-services"
import { handleAcmeDownload } from "../../../src/handlers/mobile-config/acme-download.js"
import { generateAcmeProfile } from "../../../src/handlers/mobile-config/acme.js"
import { HandlerTestLayer } from "../../../test-utils/testing-layer.js"

const withIdentity = (identity: Identity.Identity) => Layer.succeed(Middleware.CurrentIdentity, identity)

const downloadArgs = (
  clientIdentifier = "test-client",
): Homelab.MobileConfigEndpoints.AcmeDownload.AcmeDownloadMobileConfigHandlerArgs => ({
  path: { clientIdentifier },
  request: {} as any,
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

        assert(result instanceof ApiErrors.AuthorizationError)
        expect(result.resource).toBe("Config.ACME")
      }).pipe(
        Effect.provide(
          Layer.provideMerge(
            withIdentity(
              new Identity.OIDCIdentity("user@example.com", HashSet.fromIterable(["Status.Health"])),
            ),
            HandlerTestLayer,
          ),
        ),
      ))

    it.effect("should allow view-only permission (does not require create)", () =>
      Effect.gen(function*() {
        const result = yield* handleAcmeDownload(downloadArgs())

        expect(result).toContain("<?xml")
      }).pipe(
        Effect.provide(Layer.provideMerge(
          withIdentity(viewOnlyIdentity),
          HandlerTestLayer,
        )),
      ))
  })

  describe("happy path", () => {
    it.effect("should generate ACME profile via download", () =>
      Effect.gen(function*() {
        const result = yield* handleAcmeDownload(downloadArgs())

        expect(result).toContain("<?xml")
        expect(result).toContain("plist")
      }).pipe(
        Effect.provide(Layer.provideMerge(
          withIdentity(fullAccessIdentity),
          HandlerTestLayer,
        )),
      ))
  })
})

describe("generateAcmeProfile (shared logic)", () => {
  it.effect("should generate profile without authorization context", () =>
    Effect.gen(function*() {
      const result = yield* generateAcmeProfile(
        downloadArgs(
          "my-device",
        ),
      )

      expect(result).toContain("<?xml")
      expect(result).toContain("my-device")
    }).pipe(
      Effect.provide(HandlerTestLayer),
    ))

  it.effect("should reject blacklisted client identifier", () =>
    Effect.gen(function*() {
      const result = yield* Effect.flip(
        generateAcmeProfile(
          downloadArgs(
            "root",
          ),
        ),
      )

      assert(result instanceof ApiErrors.BadRequest)
      expect(result.reason).toBe("acme-invalid-client-identifier")
    }).pipe(
      Effect.provide(HandlerTestLayer),
    ))
})
