import { Schema } from "effect"

export const ConsentTextSchema = Schema.Struct({
  default: Schema.NonEmptyString,
})
