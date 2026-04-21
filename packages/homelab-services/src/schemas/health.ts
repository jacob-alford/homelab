import { HttpApiSchema } from "@effect/platform"
import { Array, Effect, flow, Option, pipe, Record, Schema, String } from "effect"

export const ServiceNameSchema = Schema.Literal(
  "Jellyfin",
  "Kanidm",
  "Step-CA",
  "RADIUS",
)

export const StatusSchema = Schema.Literal(
  "Unreachable",
  "Unhealthy",
)

export const UnhealthyResponseMessage = Schema.TemplateLiteral(
  ServiceNameSchema,
  " is ",
  StatusSchema,
  Schema.String,
)

export const HealthyResponseMessage = Schema.Literal(
  "All services healthy",
)

export const HealthResponseSchemaWire = Schema.Union(
  UnhealthyResponseMessage,
  HealthyResponseMessage,
).pipe(
  Schema.annotations({
    description: "Lists services that are unreachable or have indicated an unhealthy status",
  }),
  HttpApiSchema.withEncoding({
    kind: "Text",
    contentType: "text/plain",
  }),
)

export const HealthResponseSchemaType = Schema.Record({
  key: ServiceNameSchema,
  value: Schema.Literal(...StatusSchema.literals, "Healthy"),
})

export const HealthResponseSchema = Schema.transformOrFail(
  HealthResponseSchemaWire,
  HealthResponseSchemaType,
  {
    strict: true,
    decode(fromA) {
      if (
        fromA === "All services healthy"
      ) {
        return Effect.succeed({
          Jellyfin: "Healthy",
          Kanidm: "Healthy",
          "Step-CA": "Healthy",
          RADIUS: "Healthy",
        })
      }

      const unhealthies = pipe(
        splitTemplateComma(fromA),
        fromEntriesLiteral,
      )

      return Effect.succeed(
        {
          // @ts-expect-error -- unhealthies is really a partial record
          Jellyfin: "Healthy",
          // @ts-expect-error
          Kanidm: "Healthy",
          // @ts-expect-error
          "Step-CA": "Healthy",
          // @ts-expect-error
          "RADIUS": "Healthy",
          ...unhealthies,
        },
      )
    },
    encode(struct) {
      if (
        Record.every(
          struct,
          (status) => status === "Healthy",
        )
      ) {
        return Effect.succeed("All services healthy" as const)
      }

      return pipe(
        Record.filterMap(
          struct,
          (status, key) => status === "Healthy" ? Option.none() : Option.some(`${key} is ${status}` as const),
        ),
        Record.values,
        joinTemplatesComma,
        Effect.succeed,
      )
    },
  },
).pipe(
  HttpApiSchema.withEncoding({
    kind: "Text",
    contentType: "text/plain",
  }),
)

function joinTemplatesComma<S extends string>(strs: ReadonlyArray<S>): `${S}${string}` {
  return Array.join(strs, ", ") as `${S}${string}`
}

function splitTemplateComma<Joined extends `${typeof UnhealthyResponseMessage.Type}${string}`>(
  str: Joined,
): ReadonlyArray<readonly [typeof ServiceNameSchema.Type, typeof StatusSchema.Type]> {
  return pipe(
    String.split(str, ", "),
    Array.map(
      flow(
        String.split(" is "),
        ([service, status]) => [service as typeof ServiceNameSchema.Type, status as typeof StatusSchema.Type] as const,
      ),
    ),
  )
}

function fromEntriesLiteral<K extends string, V extends string>(
  entries: ReadonlyArray<
    readonly [key: K, value: V]
  >,
): Record<K, V> {
  return Record.fromEntries(entries) as Record<K, V>
}
