import { Schema } from "effect"

export const BufferSchema = Schema.declare(
  (input): input is Buffer => input instanceof Buffer,
  {
    identifier: "Buffer",
    description: "The NodeJS Buffer type",
    arbitrary: () => (fc) => fc.base64String().map((_) => Buffer.from(_, "base64")),
  },
)
