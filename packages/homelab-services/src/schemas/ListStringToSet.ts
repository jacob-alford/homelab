import { HashSet, Schema } from "effect"

/**
 * Represents a comma separated list string parsed
 * into a HashSet
 */
export function ListStringToSet<S extends string, R>(
  stringSchema: Schema.Schema<S, string, R>,
): Schema.Schema<HashSet.HashSet<S>, string, R> {
  return Schema.compose(
    Schema.split(","),
    Schema.transform(
      Schema.Array(stringSchema),
      Schema.HashSetFromSelf(stringSchema),
      {
        strict: true,
        decode(fromA) {
          return HashSet.fromIterable(fromA)
        },
        encode(_toI, toA) {
          return HashSet.toValues(toA)
        },
      },
    ),
  )
}
