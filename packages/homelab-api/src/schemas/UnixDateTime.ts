import { DateTime, ParseResult, Schema } from "effect"

/**
 * A unix timestamp to DateTime
 *
 * @remarks
 * why isn't this part of the base library?
 * @remarks
 * schemata-ts was better #biased
 */
export const UnixDateTime = Schema.compose(
  Schema.transform(Schema.Positive, Schema.Positive, {
    decode(s) {
      return s * 1000
    },
    encode(ms) {
      return ms / 1000
    },
  }),
  Schema.transformOrFail(
    Schema.Positive,
    Schema.DateTimeUtcFromSelf,
    {
      strict: true,
      decode(fromA, _fromI, ast) {
        return DateTime.make(fromA).pipe(
          ParseResult.fromOption(() => new ParseResult.Type(ast, fromA, "Failed to parse number into Date")),
        )
      },
      encode(_toI, _options, _ast, toA) {
        return toA.pipe(
          DateTime.toEpochMillis,
          ParseResult.succeed,
        )
      },
    },
  ),
)

export const OptionalUnixDateTime = UnixDateTime.pipe(
  Schema.optionalWith({
    exact: true,
  }),
)
