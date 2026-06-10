import { HashMap, Record, Schema } from "effect"

/**
 * A transformation from Record to HashMap
 */
export function HashSetFromRecord<
  KeyIn extends string,
  KeyOut extends string,
  Out,
  In,
  KeyR = never,
  R = never,
>(
  key: Schema.Schema<KeyOut, KeyIn, KeyR>,
  value: Schema.Schema<Out, In, R>,
): Schema.Schema<HashMap.HashMap<KeyOut, Out>, Record<KeyIn, In>, R | KeyR> {
  return Schema.transform(
    Schema.Record({ key, value }),
    Schema.HashMapFromSelf({ key, value }),
    {
      strict: true,
      decode(_fromA, fromI) {
        return HashMap.fromIterable(Record.toEntries(fromI as Record<KeyIn, In>))
      },
      encode(_toI, toA) {
        return Record.fromEntries(HashMap.toEntries(toA)) as Record<KeyOut, Out>
      },
    },
  )
}
