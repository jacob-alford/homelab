import { Schema } from "effect"

export const JSONPrimitiveSchema = Schema.Union(
  Schema.String,
  Schema.Number.pipe(Schema.finite()),
  Schema.Boolean,
  Schema.Null,
)

export type JSONPrimitive = typeof JSONPrimitiveSchema.Type

export const JSONObjectSchema: Schema.Schema<Record<string, JSON>> = Schema.suspend(() =>
  Schema.Record({
    key: Schema.String,
    value: JSONSchema,
  })
)

export const JSONArraySchema: Schema.Schema<ReadonlyArray<JSON>> = Schema.suspend(() => Schema.Array(JSONSchema))

export const JSONSchema = Schema.Union(JSONPrimitiveSchema, JSONObjectSchema, JSONArraySchema)

export interface JSONRecord {
  readonly [key: string]: JSON
}

export type JSONArray = ReadonlyArray<JSON>

export type JSON = JSONPrimitive | JSONRecord | JSONArray
