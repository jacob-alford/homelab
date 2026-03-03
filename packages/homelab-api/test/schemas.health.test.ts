import { describe, expect, it } from "@effect/vitest"
import { Arbitrary, Effect, FastCheck, Schema } from "effect"
import { constFalse, constTrue, pipe } from "effect/Function"
import { HealthResponseSchema } from "../src/schemas/health.js"

describe("HealthResponseSchema", () => {
  describe("decode", () => {
    it.effect("should decode 'All services healthy' message", () =>
      Effect.gen(function*() {
        const result = yield* Schema.decode(HealthResponseSchema)("All services healthy")

        expect(result).toEqual({
          Jellyfin: "Healthy",
          Kanidm: "Healthy",
          "Step-CA": "Healthy",
          RADIUS: "Healthy",
        })
      }))

    it.effect("should decode single unhealthy service", () =>
      Effect.gen(function*() {
        const result = yield* Schema.decode(HealthResponseSchema)("Jellyfin is Unreachable")

        expect(result).toEqual({
          Jellyfin: "Unreachable",
          Kanidm: "Healthy",
          "Step-CA": "Healthy",
          RADIUS: "Healthy",
        })
      }))

    it.effect("should decode multiple unhealthy services", () =>
      Effect.gen(function*() {
        const result = yield* Schema.decode(HealthResponseSchema)(
          "Jellyfin is Unreachable, Kanidm is Unhealthy, Step-CA is Unreachable",
        )

        expect(result).toEqual({
          Jellyfin: "Unreachable",
          Kanidm: "Unhealthy",
          "Step-CA": "Unreachable",
          RADIUS: "Healthy",
        })
      }))
  })

  describe("encode", () => {
    it.effect("should encode all healthy services", () =>
      Effect.gen(function*() {
        const result = yield* Schema.encode(HealthResponseSchema)({
          Jellyfin: "Healthy",
          Kanidm: "Healthy",
          "Step-CA": "Healthy",
          RADIUS: "Healthy",
        })

        expect(result).toBe("All services healthy")
      }))

    it.effect("should encode single unhealthy service", () =>
      Effect.gen(function*() {
        const result = yield* Schema.encode(HealthResponseSchema)({
          Jellyfin: "Unreachable",
          Kanidm: "Healthy",
          "Step-CA": "Healthy",
          RADIUS: "Healthy",
        })

        expect(result).toBe("Jellyfin is Unreachable")
      }))

    it.effect("should encode multiple unhealthy services with comma-space separator", () =>
      Effect.gen(function*() {
        const result = yield* Schema.encode(HealthResponseSchema)({
          Jellyfin: "Unreachable",
          Kanidm: "Unhealthy",
          "Step-CA": "Healthy",
          RADIUS: "Healthy",
        })

        expect(result).toBe("Jellyfin is Unreachable, Kanidm is Unhealthy")
      }))
  })

  describe("round-trip encode/decode", () => {
    it.effect("should round-trip for any valid health status record", () =>
      Effect.gen(function*() {
        const arbitrary = Arbitrary.make(Schema.typeSchema(HealthResponseSchema))

        yield* Effect.try(
          () =>
            FastCheck.assert(
              FastCheck.asyncProperty(
                arbitrary,
                (healthStatus) =>
                  pipe(
                    healthStatus,
                    Schema.encode(HealthResponseSchema),
                    Effect.flatMap(Schema.decode(HealthResponseSchema)),
                    Effect.map((_) => expect(_).toEqual(healthStatus)),
                    Effect.mapBoth(
                      {
                        onFailure: constFalse,
                        onSuccess: constTrue,
                      },
                    ),
                    Effect.runPromise,
                  ),
              ),
            ),
        )
      }))
  })
})
