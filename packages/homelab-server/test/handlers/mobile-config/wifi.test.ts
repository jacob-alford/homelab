import { describe, expect, it } from "@effect/vitest"
import { Effect, HashSet, Layer } from "effect"
import type { Homelab } from "homelab-api"
import { Identity, Middleware } from "homelab-services"
import { handleWifi } from "../../../src/handlers/mobile-config/wifi.js"
import { HandlerTestLayer } from "../../../test-utils/testing-layer.js"

const withIdentity = (identity: Identity.Identity) => Layer.succeed(Middleware.CurrentIdentity, identity)

const wifiArgs = (overrides?: {
  ssid?: string
  encryption?: "WPA3" | "WPA2"
  password?: string
  username?: string
  disableMACRandomization?: boolean
  enterpriseClientType?: "PEAP" | "EAP-TLS"
}): Homelab.MobileConfigEndpoints.Wifi.WifiMobileConfigHandlerArgs => ({
  path: {
    ssid: overrides?.ssid ?? "0x676179",
    encryption: overrides?.encryption ?? "WPA3" as const,
  },
  payload: {
    password: overrides?.password ?? "test-password",
    disableMACRandomization: overrides?.disableMACRandomization ?? false,
    ...(overrides?.username !== undefined ? { username: overrides.username } : {}),
    ...(overrides?.enterpriseClientType !== undefined
      ? { enterpriseClientType: overrides.enterpriseClientType }
      : {}),
  },
  request: {} as any,
})

const authorizedIdentity = new Identity.OIDCIdentity(
  "user@example.com",
  HashSet.fromIterable(["Config.Wifi"]),
)

describe("handleWifi", () => {
  describe("authorization", () => {
    it.effect("should deny access when identity lacks Config.Wifi permission", () =>
      Effect.gen(function*() {
        const result = yield* Effect.flip(handleWifi(wifiArgs()))

        expect(result._tag).toBe("AuthorizationError")
        expect(result.resource).toBe("Config.Wifi")
      }).pipe(
        Effect.provide(withIdentity(
          new Identity.OIDCIdentity("user@example.com", HashSet.fromIterable(["Status.Health"])),
        )),
        Effect.provide(HandlerTestLayer),
      ))

    it.effect("should deny access with empty permissions", () =>
      Effect.gen(function*() {
        const result = yield* Effect.flip(handleWifi(wifiArgs()))

        expect(result._tag).toBe("AuthorizationError")
      }).pipe(
        Effect.provide(withIdentity(
          new Identity.OIDCIdentity("user@example.com", HashSet.fromIterable([])),
        )),
        Effect.provide(HandlerTestLayer),
      ))

    it.effect("should deny when OIDC identity principle does not match username", () =>
      Effect.gen(function*() {
        const result = yield* Effect.flip(handleWifi(wifiArgs({ username: "alice" })))

        expect(result._tag).toBe("AuthorizationError")
        expect(result.message).toBe("User's principle identifer must match the requested username")
      }).pipe(
        Effect.provide(withIdentity(
          new Identity.OIDCIdentity("john@example.com", HashSet.fromIterable(["Config.Wifi"])),
        )),
        Effect.provide(HandlerTestLayer),
      ))
  })

  describe("happy path", () => {
    it.effect("should generate WPA personal wifi profile", () =>
      Effect.gen(function*() {
        const result = yield* handleWifi(wifiArgs())

        expect(result).toContain("<?xml")
        expect(result).toContain("plist")
        expect(result).toContain("0x676179")
      }).pipe(
        Effect.provide(withIdentity(authorizedIdentity)),
        Effect.provide(HandlerTestLayer),
      ))

    it.effect("should generate WPA2 wifi profile", () =>
      Effect.gen(function*() {
        const result = yield* handleWifi(wifiArgs({ encryption: "WPA2" }))

        expect(result).toContain("<?xml")
        expect(result).toContain("plist")
      }).pipe(
        Effect.provide(withIdentity(authorizedIdentity)),
        Effect.provide(HandlerTestLayer),
      ))

    it.effect("should generate enterprise PEAP wifi profile with matching username", () =>
      Effect.gen(function*() {
        const result = yield* handleWifi(wifiArgs({
          enterpriseClientType: "PEAP",
          username: "user",
        }))

        expect(result).toContain("<?xml")
        expect(result).toContain("plist")
      }).pipe(
        Effect.provide(withIdentity(authorizedIdentity)),
        Effect.provide(HandlerTestLayer),
      ))
  })

  describe("internal errors", () => {
    it.effect("should return NotImplemented for EAP-TLS", () =>
      Effect.gen(function*() {
        const result = yield* Effect.flip(handleWifi(wifiArgs({
          enterpriseClientType: "EAP-TLS",
        })))

        expect(result._tag).toBe("NotImplemented")
      }).pipe(
        Effect.provide(withIdentity(authorizedIdentity)),
        Effect.provide(HandlerTestLayer),
      ))

    it.effect("should return BadRequest for PEAP without username", () =>
      Effect.gen(function*() {
        const result = yield* Effect.flip(handleWifi(wifiArgs({
          enterpriseClientType: "PEAP",
        })))

        expect(result._tag).toBe("BadRequest")
        expect(result.reason).toBe("eap-client-username-required")
      }).pipe(
        Effect.provide(withIdentity(authorizedIdentity)),
        Effect.provide(HandlerTestLayer),
      ))

    it.effect("should return NotFound for unknown SSID", () =>
      Effect.gen(function*() {
        const result = yield* Effect.flip(handleWifi(wifiArgs({ ssid: "unknown-ssid" })))

        expect(result._tag).toBe("NotFound")
        expect(result.reason).toBe("ssid-not-found")
      }).pipe(
        Effect.provide(withIdentity(authorizedIdentity)),
        Effect.provide(HandlerTestLayer),
      ))
  })
})
