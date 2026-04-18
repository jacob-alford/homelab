import { Effect, ParseResult, Schema } from "effect"
import { Base64 } from "./Base64.js"
import { Optional } from "./optionals.js"

export const BufferSchema = Schema.declare(
  (input): input is Buffer => input instanceof Buffer,
  {
    identifier: "Buffer",
    description: "The NodeJS Buffer type",
    arbitrary: () => (fc) => fc.base64String().map((_) => Buffer.from(_, "base64")),
  },
)

export const BufferFromBase64 = Schema.transformOrFail(
  Base64,
  BufferSchema,
  {
    decode(base64, _options, ast) {
      return Effect.try({
        try() {
          return Buffer.from(base64, "hex")
        },
        catch(err) {
          return new ParseResult.Type(ast, base64, `Unexpected error while converting Base64 to Buffer: ${err}`)
        },
      })
    },
    encode(buffer, _options, ast) {
      return Effect.try({
        try() {
          return buffer.toString("base64")
        },
        catch(err) {
          return new ParseResult.Type(ast, buffer, `Unexpected error while converting Buffer to Base64: ${err}`)
        },
      })
    },
  },
)

export const OptionalBufferFromBase64 = Optional(BufferFromBase64)

export const StringFromUint8Array = Schema.transformOrFail(
  Schema.Uint8ArrayFromSelf,
  Schema.String,
  {
    decode(fromA, _options, ast) {
      return Effect.try({
        try() {
          return Buffer.from(fromA).toString("utf-8")
        },
        catch(err) {
          return new ParseResult.Type(ast, fromA, `Unexpected error trying to decode buffer: ${err}`)
        },
      })
    },
    encode(toI, _options, ast) {
      return Effect.try({
        try() {
          return Uint8Array.from(toI)
        },
        catch(err) {
          return new ParseResult.Type(ast, toI, `Unexpected error trying to encode buffer: ${err}`)
        },
      })
    },
  },
)
