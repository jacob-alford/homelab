import { Array, Effect, Schema } from "effect"

export function EnsureArray<A, I, R>(schema: Schema.Schema<A, I, R>) {
  return Schema.transformOrFail(
    Schema.Union(schema, Schema.Array(schema)),
    Schema.Array(schema),
    {
      strict: true,
      decode(_fromA, _options, _ast, fromI) {
        return Effect.succeed(isArray(fromI) ? fromI : Array.of(fromI))
      },
      encode(_toI, _options, _ast, toA) {
        return Effect.succeed(toA)
      },
    },
  )
}

function isArray<T>(arr: T | ReadonlyArray<T>): arr is ReadonlyArray<T> {
  return Array.isArray(arr)
}
