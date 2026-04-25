import { HashSet, Schema } from "effect"

/**
 * A transformation from Array to HashSet
 */
export function HashSetFromArray<Out, In, R>(
  schema: Schema.Schema<Out, In, R>,
): Schema.Schema<HashSet.HashSet<Out>, ReadonlyArray<In>, R> {
  return Schema.transform(
    Schema.Array(schema),
    Schema.HashSetFromSelf(schema),
    {
      strict: true,
      decode(_fromA, inA) {
        return HashSet.fromIterable(inA)
      },
      encode(_toI, toA) {
        return HashSet.toValues(toA)
      },
    },
  )
}
