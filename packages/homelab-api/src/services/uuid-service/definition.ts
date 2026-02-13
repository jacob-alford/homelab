import type { Effect } from "effect"
import { Context, Data, Schema } from "effect"

export const UuidServiceId = "homelab-api/services/uuid-service/UuidService"

export class UuidGenerationError extends Data.TaggedError("UuidGenerationError")<
  {
    readonly error: unknown
  }
> {}

export const UUIDSymbol = Symbol.for("homelab/UUID")

export const UUIDSchema = Schema.UUID.pipe(
  Schema.brand(UUIDSymbol),
)

export type UUID = typeof UUIDSchema.Type

export interface UuidServiceDef {
  uuid(): Effect.Effect<UUID, UuidGenerationError>
}

export class UuidService extends Context.Tag(UuidServiceId)<UuidService, UuidServiceDef>() {
}
