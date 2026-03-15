import { Schema } from "effect"

export const OptionalStringOrArray = Schema.Union(
  Schema.String,
  Schema.Array(Schema.String),
).pipe(
  Schema.optionalWith({ exact: true }),
)

export const OptionalString = Schema.String.pipe(
  Schema.optionalWith({
    exact: true,
  }),
)

export const OptionalUrl = Schema.URL.pipe(
  Schema.optionalWith({
    exact: true,
  }),
)

export const OptionalUnknown = Schema.Unknown.pipe(
  Schema.optionalWith({
    exact: true,
  }),
)
