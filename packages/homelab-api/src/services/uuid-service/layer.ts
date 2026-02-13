import { Effect, Layer, pipe, Schema } from "effect"
import { randomUUID } from "node:crypto"
import type { UUID, UuidServiceDef } from "./definition.js"
import { UuidGenerationError, UUIDSchema, UuidService } from "./definition.js"

class UuidServiceImpl implements UuidServiceDef {
  uuid(): Effect.Effect<UUID, UuidGenerationError> {
    return Effect.gen(function*() {
      const uuid = yield* Effect.try({
        try() {
          return randomUUID()
        },
        catch(error) {
          return new UuidGenerationError({
            error,
          })
        },
      })

      return yield* pipe(
        uuid,
        Schema.decode(UUIDSchema),
        Effect.orDie,
      )
    })
  }
}

export const UuidServiceLive = Layer.succeed(UuidService, new UuidServiceImpl())
