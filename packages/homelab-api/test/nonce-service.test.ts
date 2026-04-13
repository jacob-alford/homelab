import { NodeFileSystem } from "@effect/platform-node"
import { describe, expect, it } from "@effect/vitest"
import { ConfigProvider, DateTime, Effect, Layer } from "effect"
import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import { Services } from "../src/index.js"

function createTestSecretFile(): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nonce-test-"))
  const secretPath = path.join(tmpDir, "secret")
  fs.writeFileSync(secretPath, "test-hmac-secret-key")
  return secretPath
}

const secretFilePath = createTestSecretFile()

const TestConfigProvider = Layer.setConfigProvider(
  ConfigProvider.fromMap(
    new Map([["HOMELAB_SECRET_FILE", secretFilePath]]),
  ),
)

const TestLayer = Services.NonceService.NonceServiceLive.pipe(
  Layer.provideMerge(Services.HMACService.HMACServiceLive),
  Layer.provideMerge(NodeFileSystem.layer),
  Layer.provideMerge(TestConfigProvider),
)

describe("NonceService", () => {
  describe("withTime", () => {
    it.effect("should generate a nonce with two parts separated by a period", () =>
      Effect.gen(function*() {
        const now = yield* DateTime.now
        const nonce = yield* Services.NonceService.withTime(now)

        const parts = nonce.split(".")
        expect(parts).toHaveLength(2)
        expect(Number(parts[0])).not.toBeNaN()
        expect(parts[1]!.length).toBeGreaterThan(0)
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should include the unix timestamp as the first part", () =>
      Effect.gen(function*() {
        const time = DateTime.unsafeMake(1700000000000)
        const nonce = yield* Services.NonceService.withTime(time)

        const [timestamp] = nonce.split(".")
        expect(timestamp).toBe("1700000000")
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should produce deterministic nonces for the same time", () =>
      Effect.gen(function*() {
        const time = DateTime.unsafeMake(1700000000000)
        const nonce1 = yield* Services.NonceService.withTime(time)
        const nonce2 = yield* Services.NonceService.withTime(time)

        expect(nonce1).toBe(nonce2)
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should produce different nonces for different times", () =>
      Effect.gen(function*() {
        const time1 = DateTime.unsafeMake(1700000000000)
        const time2 = DateTime.unsafeMake(1700000001000)
        const nonce1 = yield* Services.NonceService.withTime(time1)
        const nonce2 = yield* Services.NonceService.withTime(time2)

        expect(nonce1).not.toBe(nonce2)
      }).pipe(Effect.provide(TestLayer)))
  })

  describe("validateNonce", () => {
    it.effect("should return the DateTime encoded in the nonce", () =>
      Effect.gen(function*() {
        const time = DateTime.unsafeMake(1700000000000)
        const nonce = yield* Services.NonceService.withTime(time)

        const result = yield* Services.NonceService.validateNonce(nonce)
        expect(DateTime.toEpochMillis(result)).toBe(1700000000000)
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should roundtrip through withTime and validateNonce", () =>
      Effect.gen(function*() {
        const now = yield* DateTime.now
        const epochSeconds = Math.floor(DateTime.toEpochMillis(now) / 1000)
        const nonce = yield* Services.NonceService.withTime(now)

        const result = yield* Services.NonceService.validateNonce(nonce)
        expect(DateTime.toEpochMillis(result)).toBe(epochSeconds * 1000)
      }).pipe(Effect.provide(TestLayer)))
  })

  describe("validation errors", () => {
    it.effect("should fail with invalid-format for nonce without period", () =>
      Effect.gen(function*() {
        const result = yield* Effect.flip(
          Services.NonceService.validateNonce("no-period-here"),
        )

        expect(result._tag).toBe("NonceValidationError")
        if (result._tag === "NonceValidationError") {
          expect(result.reason).toBe("invalid-format")
        }
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should fail with invalid-format for nonce with non-numeric timestamp", () =>
      Effect.gen(function*() {
        const result = yield* Effect.flip(
          Services.NonceService.validateNonce("notanumber.somehash"),
        )

        expect(result._tag).toBe("NonceValidationError")
        if (result._tag === "NonceValidationError") {
          expect(result.reason).toBe("invalid-format")
        }
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should fail with invalid-hmac for tampered nonce", () =>
      Effect.gen(function*() {
        const time = DateTime.unsafeMake(1700000000000)
        const nonce = yield* Services.NonceService.withTime(time)
        const [timestamp] = nonce.split(".")
        const tamperedNonce = `${timestamp}.tampered-hmac`

        const result = yield* Effect.flip(
          Services.NonceService.validateNonce(tamperedNonce),
        )

        expect(result._tag).toBe("NonceValidationError")
        if (result._tag === "NonceValidationError") {
          expect(result.reason).toBe("invalid-hmac")
        }
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should fail with invalid-hmac for nonce with modified timestamp", () =>
      Effect.gen(function*() {
        const time = DateTime.unsafeMake(1700000000000)
        const nonce = yield* Services.NonceService.withTime(time)
        const [, hmac] = nonce.split(".")
        const tamperedNonce = `1700000001.${hmac}`

        const result = yield* Effect.flip(
          Services.NonceService.validateNonce(tamperedNonce),
        )

        expect(result._tag).toBe("NonceValidationError")
        if (result._tag === "NonceValidationError") {
          expect(result.reason).toBe("invalid-hmac")
        }
      }).pipe(Effect.provide(TestLayer)))
  })
})
