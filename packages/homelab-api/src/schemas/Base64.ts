import { Schema } from "effect"

export const Base64 = Schema.String.pipe(
  // https://regex101.com/library/lXFWqM
  Schema.pattern(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}={2})$/g),
)

export const Base64Url = Schema.String.pipe(
  Schema.pattern(/^[A-Za-z0-9_-]+$/g),
)

export const OptionalBase64Url = Base64Url.pipe(
  Schema.optionalWith({
    exact: true,
  }),
)
