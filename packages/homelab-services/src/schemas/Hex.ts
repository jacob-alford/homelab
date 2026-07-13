import { Schema } from "effect"
import { Optional } from "./optionals.js"

export const Hex = Schema.String.pipe(
  Schema.pattern(/^[a-fA-F\d]+$/),
  Schema.compose(
    Schema.Lowercase,
  ),
)

export const OptionalHex = Optional(Hex)
