import { Schema } from "effect"

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
