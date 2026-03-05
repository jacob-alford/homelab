import { HashSet, Schema } from "effect"

/**
 * Represents a comma separated list string parsed
 * into a HashSet
 */
export const GroupsClaimSchema = Schema.compose(
  Schema.split(","),
  Schema.transform(
    Schema.Array(Schema.String),
    Schema.HashSetFromSelf(Schema.String),
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
