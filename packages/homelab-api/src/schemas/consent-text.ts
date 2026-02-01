import { Schema } from "effect"

export const ConsentText = Schema.Struct({
  default: Schema.NonEmptyString,
})

