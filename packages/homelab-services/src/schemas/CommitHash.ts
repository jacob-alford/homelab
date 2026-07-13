import { ParseResult, Schema } from "effect"
import { Hex } from "./Hex.js"

export const CommitHash = Hex.pipe(
  Schema.filter(
    (hex): hex is string => hex.length === 40,
    {
      message() {
        return "Expected hexadecimal string of length 40"
      },
    },
  ),
  Schema.brand("CommitHash"),
)

export const ShortCommitHash = Hex.pipe(
  Schema.filter(
    (hex): hex is string => hex.length === 7,
    {
      message() {
        return "Expected hexadecimal string of length 7"
      },
    },
  ),
  Schema.brand("ShortCommitHash"),
)

export const ShortCommitHashFromCommitHash = CommitHash.pipe(
  Schema.transformOrFail(
    ShortCommitHash,
    {
      decode(fromA) {
        return ParseResult.succeed(fromA.substring(0, 7))
      },
      encode(_, __, ast) {
        return ParseResult.fail(new ParseResult.Forbidden(ast, __, "Unable to form commit hash from short commit hash"))
      },
    },
  ),
)
