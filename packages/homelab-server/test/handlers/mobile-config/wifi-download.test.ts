import { describe, expect, it } from "@effect/vitest"
import { Effect, HashSet, Layer } from "effect"
import { Identity, Middleware } from "homelab-api"
import { handleWifiDownload } from "../../../src/handlers/mobile-config/wifi-download.js"
import { generateWifiProfile } from "../../../src/handlers/mobile-config/wifi.js"
import { HandlerTestLayer } from "../../../test-utils/testing-layer.js"

const withIdentity = (identity: Identity.Identity) => Layer.succeed(Middleware.CurrentIdentity, identity)

const downloadArgs = (overrides?: {
  ssid?: string
  encryption?: "WPA3" | "WPA2"
  password?: string
}) => ({
  path: {
    ssid: overrides?.ssid ?? "0x676179",
    encryption: overrides?.encryption ?? "WPA3" as const,
  },
  urlParams: {
    password: overrides?.password ?? "test-password",
    disableMACRandomization: false,
  },
})

const viewOnlyIdentity = new Identity.OIDCIdentity(
  "user@example.com",
  HashSet.fromIterable(["Config.Wifi.view"]),
)

const fullAccessIdentity = new Identity.OIDCIdentity(
  "user@example.com",
  HashSet.fromIterable(["Config.Wifi"]),
)

describe("handleWifiDownload", () => {
  describe("authorization", () => {
    it.effect("should deny access when identity lacks Config.Wifi permission", () =>
      Effect.gen(function*() {
        const result = yield* Effect.flip(handleWifiDownload(downloadArgs()))

        expect(result._tag).toBe("AuthorizationError")
        expect(result.resource).toBe("Config.Wifi")
      }).pipe(
        Effect.provide(withIdentity(
          new Identity.OIDCIdentity("user@example.com", HashSet.fromIterable(["Status.Health"])),
        )),
        Effect.provide(HandlerTestLayer),
      ))

    it.effect("should allow view-only permission (does not require create)", () =>
      Effect.gen(function*() {
        const result = yield* handleWifiDownload(downloadArgs())

        expect(result).toContain("<?xml")
      }).pipe(
        Effect.provide(withIdentity(viewOnlyIdentity)),
        Effect.provide(HandlerTestLayer),
      ))
  })

  describe("happy path", () => {
    it.effect("should generate wifi profile via download", () =>
      Effect.gen(function*() {
        const result = yield* handleWifiDownload(downloadArgs())

        expect(result).toContain("<?xml")
        expect(result).toContain("plist")
        expect(result).toContain("0x676179")
      }).pipe(
        Effect.provide(withIdentity(fullAccessIdentity)),
        Effect.provide(HandlerTestLayer),
      ))
  })
})

describe("generateWifiProfile (shared logic)", () => {
  it.effect("should generate profile without authorization context", () =>
    Effect.gen(function*() {
      const result = yield* generateWifiProfile({
        path: { ssid: "dialup-express", encryption: "WPA3" as const },
        payload: { password: "secret", disableMACRandomization: false },
      })

      expect(result).toContain("<?xml")
      expect(result).toContain("dialup-express")
    }).pipe(
      Effect.provide(HandlerTestLayer),
    ))
})
