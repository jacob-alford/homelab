import { assert, describe, expect, it } from "@effect/vitest"
import { Effect, HashSet, Layer } from "effect"
import { type Homelab } from "homelab-api"
import { ApiErrors, Identity, Middleware } from "homelab-services"
import { handleCerts } from "../../../src/handlers/mobile-config/certs.js"
import { HandlerTestLayer } from "../../../test-utils/testing-layer.js"

const withIdentity = (identity: Identity.Identity) => Layer.succeed(Middleware.CurrentIdentity, identity)

const certsArgs = (): Homelab.MobileConfigEndpoints.Certs.CertsHandlerArgs => ({
  request: {} as any,
})

const authorizedIdentity = new Identity.OIDCIdentity(
  "user@example.com",
  HashSet.fromIterable(["Config.Certs"]),
)

describe("handleCerts", () => {
  describe("authorization", () => {
    it.effect("should deny access when identity lacks Config.Certs permission", () =>
      Effect.gen(function*() {
        const result = yield* Effect.flip(handleCerts(certsArgs()))

        assert(result instanceof ApiErrors.AuthorizationError)
        expect(result.resource).toBe("Config.Certs")
      }).pipe(
        Effect.provide(Layer.provideMerge(
          withIdentity(
            new Identity.OIDCIdentity("user@example.com", HashSet.fromIterable(["Status.Health"])),
          ),
          HandlerTestLayer,
        )),
      ))

    it.effect("should deny access with empty permissions", () =>
      Effect.gen(function*() {
        const result = yield* Effect.flip(handleCerts(certsArgs()))

        assert(result instanceof ApiErrors.AuthorizationError)
      }).pipe(
        Effect.provide(Layer.provideMerge(
          withIdentity(
            new Identity.OIDCIdentity("user@example.com", HashSet.fromIterable([])),
          ),
          HandlerTestLayer,
        )),
      ))

    it.effect("should allow guest identity to view certs", () =>
      Effect.gen(function*() {
        const result = yield* handleCerts(certsArgs())

        expect(result).toContain("<?xml")
        expect(result).toContain("plist")
      }).pipe(
        Effect.provide(Layer.provideMerge(
          withIdentity(new Identity.GuestIdentity()),
          HandlerTestLayer,
        )),
      ))
  })

  describe("happy path", () => {
    it.effect("should generate certificate profile", () =>
      Effect.gen(function*() {
        const result = yield* handleCerts(certsArgs())

        expect(result).toContain("<?xml")
        expect(result).toContain("plist")
      }).pipe(
        Effect.provide(Layer.provideMerge(
          withIdentity(authorizedIdentity),
          HandlerTestLayer,
        )),
      ))

    it.effect("should allow mTLS identity with Config.Certs permission", () =>
      Effect.gen(function*() {
        const result = yield* handleCerts(certsArgs())

        expect(result).toContain("<?xml")
        expect(result).toContain("plist")
      }).pipe(
        Effect.provide(Layer.provideMerge(
          withIdentity(
            new Identity.MTLSIdentity("client.example.com", HashSet.fromIterable(["Config.Certs"])),
          ),
          HandlerTestLayer,
        )),
      ))
  })
})
