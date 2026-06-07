import { Schema } from "effect"
import { type LazyArg } from "effect/Function"

export const OptionalStringOrArray = Optional(
  Schema.Union(
    Schema.String,
    Schema.Array(Schema.String),
  ),
)

export const OptionalString = Optional(
  Schema.String,
)

export const OptionalUrl = Optional(Schema.URL)

export const OptionalUnknown = Optional(Schema.Unknown)

export function OptionalArray<A, I, R>(schema: Schema.Schema<A, I, R>) {
  return Optional(Schema.Array(schema))
}

export function Optional<A, I, R>(schema: Schema.Schema<A, I, R>) {
  return schema.pipe(
    Schema.optionalWith({ exact: true }),
  )
}

export function OptionalWithDefault<A, I, R>(schema: Schema.Schema<A, I, R>, _default: LazyArg<A>) {
  return schema.pipe(
    Schema.optionalWith({
      exact: true,
      default: _default,
    }),
  )
}
