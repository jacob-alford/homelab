import { describe, expect, it } from "@effect/vitest"
import { Effect, HashSet, Layer } from "effect"
import { Identity, Middleware } from "homelab-api"
import { handleHealth } from "../../../src/handlers/status/health.js"
import { HandlerTestLayer } from "../../../test-utils/testing-layer.js"

const withIdentity = (identity: Identity.Identity) => Layer.succeed(Middleware.CurrentIdentity, identity)

describe("handleHealth", () => {
  it.effect("should return health status for identity with Status.Health permission", () =>
    Effect.gen(function*() {
      const result = yield* handleHealth({})

      expect(result).toBe("All services healthy")
    }).pipe(
      Effect.provide(withIdentity(
        new Identity.OIDCIdentity("user@example.com", HashSet.fromIterable(["Status.Health"])),
      )),
      Effect.provide(HandlerTestLayer),
    ))

  it.effect("should deny guest identity access to health", () =>
    Effect.gen(function*() {
      const result = yield* Effect.flip(handleHealth({}))

      expect(result._tag).toBe("AuthorizationError")
    }).pipe(
      Effect.provide(withIdentity(new Identity.GuestIdentity())),
      Effect.provide(HandlerTestLayer),
    ))

  it.effect("should deny access when identity lacks Status.Health permission", () =>
    Effect.gen(function*() {
      const result = yield* Effect.flip(handleHealth({}))

      expect(result._tag).toBe("AuthorizationError")
      expect(result.resource).toBe("Status.Health")
    }).pipe(
      Effect.provide(withIdentity(
        new Identity.OIDCIdentity("user@example.com", HashSet.fromIterable(["Config.Wifi"])),
      )),
      Effect.provide(HandlerTestLayer),
    ))

  it.effect("should deny access with empty permissions", () =>
    Effect.gen(function*() {
      const result = yield* Effect.flip(handleHealth({}))

      expect(result._tag).toBe("AuthorizationError")
      expect(result.resource).toBe("Status.Health")
    }).pipe(
      Effect.provide(withIdentity(
        new Identity.OIDCIdentity("user@example.com", HashSet.fromIterable([])),
      )),
      Effect.provide(HandlerTestLayer),
    ))

  it.effect("should allow mTLS identity with Status.Health permission", () =>
    Effect.gen(function*() {
      const result = yield* handleHealth({})

      expect(result).toBe("All services healthy")
    }).pipe(
      Effect.provide(withIdentity(
        new Identity.MTLSIdentity("client.example.com", HashSet.fromIterable(["Status.Health"])),
      )),
      Effect.provide(HandlerTestLayer),
    ))
})
