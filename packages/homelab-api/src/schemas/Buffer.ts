import { Schema } from "effect"

export const Buffer = Schema.declare(
  (input): input is Buffer => input instanceof Buffer,
  {
    identifier: "Buffer",
    description: "The NodeJS Buffer type",
  },
)
