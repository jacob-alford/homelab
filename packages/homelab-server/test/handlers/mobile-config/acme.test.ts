import { assert, describe, expect, it } from "@effect/vitest"
import { Effect, HashSet, Layer } from "effect"
import { type Homelab } from "homelab-api"
import { ApiErrors, Identity, Middleware } from "homelab-services"
import { handleAcme } from "../../../src/handlers/mobile-config/acme.js"
import { HandlerTestLayer } from "../../../test-utils/testing-layer.js"

const withIdentity = (identity: Identity.Identity) => Layer.succeed(Middleware.CurrentIdentity, identity)

const acmeArgs = (
  clientIdentifier = "test-client",
): Homelab.MobileConfigEndpoints.Acme.AcmeMobileConfigHandlerArgs => ({
  path: { clientIdentifier },
  request: {} as any,
  headers: {},
})

const authorizedIdentity = new Identity.OIDCIdentity(
  "user@example.com",
  HashSet.fromIterable(["Config_ACME"]),
)

describe("handleAcme", () => {
  describe("authorization", () => {
    it.effect("should deny access when identity lacks Config_ACME permission", () =>
      Effect.gen(function*() {
        const result = yield* Effect.flip(handleAcme(acmeArgs()))

        assert(result instanceof ApiErrors.AuthorizationError)
        expect(result.resource).toBe("Config_ACME")
      }).pipe(
        Effect.provide(Layer.provideMerge(
          withIdentity(
            new Identity.OIDCIdentity("user@example.com", HashSet.fromIterable(["Status_Health"])),
          ),
          HandlerTestLayer,
        )),
      ))

    it.effect("should deny access with empty permissions", () =>
      Effect.gen(function*() {
        const result = yield* Effect.flip(handleAcme(acmeArgs()))

        assert(result instanceof ApiErrors.AuthorizationError)
      }).pipe(
        Effect.provide(Layer.provideMerge(
          withIdentity(
            new Identity.OIDCIdentity("user@example.com", HashSet.fromIterable([])),
          ),
          HandlerTestLayer,
        )),
      ))
  })

  describe("happy path", () => {
    it.effect("should generate ACME profile", () =>
      Effect.gen(function*() {
        const result = yield* handleAcme(acmeArgs())

        expect(result).toContain("<?xml")
        expect(result).toContain("plist")
      }).pipe(
        Effect.provide(Layer.provideMerge(
          withIdentity(authorizedIdentity),
          HandlerTestLayer,
        )),
      ))

    it.effect("should generate ACME profile with custom client identifier", () =>
      Effect.gen(function*() {
        const result = yield* handleAcme(acmeArgs("my-device"))

        expect(result).toContain("<?xml")
        expect(result).toContain("plist")
        expect(result).toContain("my-device")
      }).pipe(
        Effect.provide(Layer.provideMerge(
          withIdentity(authorizedIdentity),
          HandlerTestLayer,
        )),
      ))
  })

  describe("internal errors", () => {
    it.effect("should return BadRequest for blacklisted client identifier 'root'", () =>
      Effect.gen(function*() {
        const result = yield* Effect.flip(handleAcme(acmeArgs("root")))

        assert(result instanceof ApiErrors.BadRequest)
        expect(result.reason).toBe("acme-invalid-client-identifier")
      }).pipe(
        Effect.provide(Layer.provideMerge(
          withIdentity(authorizedIdentity),
          HandlerTestLayer,
        )),
      ))

    it.effect("should return BadRequest for blacklisted client identifier 'postgres'", () =>
      Effect.gen(function*() {
        const result = yield* Effect.flip(handleAcme(acmeArgs("postgres")))

        assert(result instanceof ApiErrors.BadRequest)
        expect(result.reason).toBe("acme-invalid-client-identifier")
      }).pipe(
        Effect.provide(Layer.provideMerge(
          withIdentity(authorizedIdentity),
          HandlerTestLayer,
        )),
      ))
  })
})
