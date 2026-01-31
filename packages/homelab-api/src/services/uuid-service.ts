import type { ParseResult } from "effect"
import { Context, Data, Effect, Layer, pipe, Schema } from "effect"
import { randomUUID } from "node:crypto"

export const UuidServiceId = "homelab-api/services/uuid-service/UuidService"

export class UuidGenerationError extends Data.TaggedError("UuidGenerationError")<
  {
    readonly error: unknown
  }
> { }

export const UUIDSymbol = Symbol.for("homelab/UUID")

export const UUIDSchema = Schema.UUID.pipe(
  Schema.brand(UUIDSymbol),
)

export type UUID = typeof UUIDSchema.Type

export class UuidServiceImpl {
  uuid(): Effect.Effect<UUID, UuidGenerationError | ParseResult.ParseError> {
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
      )
    })
  }
}

export class UuidService extends Context.Tag(UuidServiceId)<UuidService, UuidServiceImpl>() {
  static default = new UuidServiceImpl()
}

export const UuidServiceLive = Layer.succeed(UuidService, UuidService.default)
