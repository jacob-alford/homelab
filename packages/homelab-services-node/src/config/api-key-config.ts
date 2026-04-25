import { FileSystem } from "@effect/platform"
import { Array, Data, Effect, flow, HashMap, Layer, Option, pipe, Redacted, Schema, Tuple } from "effect"
import { Config, Schemas } from "homelab-services"

const ApiKeyMapSchema = Schema.transform(
  Schema.Array(
    Schema.Struct({
      apiKey: Schema.Redacted(Schema.String),
      email: Schema.String,
      permissions: Schemas.HashSetFromArray.HashSetFromArray(Schemas.ScopeGroups.ScopeGroupSchema),
    }),
  ),
  Schema.HashMapFromSelf({
    key: Schema.RedactedFromSelf(Schema.String),
    value: Schema.Tuple(Schema.HashSetFromSelf(Schemas.ScopeGroups.ScopeGroupSchema), Schema.String),
  }),
  {
    strict: true,
    decode: flow(
      Array.map(({ apiKey, email, permissions }) => Data.tuple(apiKey, Data.tuple(permissions, email))),
      HashMap.fromIterable,
    ),
    encode(_toI, toA) {
      return pipe(
        toA,
        HashMap.toEntries,
        Array.map(([apiKey, [permissions, email]]) => ({
          apiKey,
          email,
          permissions,
        })),
      )
    },
  },
)

const ParseApiKeys = Schema.compose(
  Schemas.Buffer.StringFromUint8Array,
  Schema.parseJson(ApiKeyMapSchema),
)

export const ApiKeyConfigLive = Layer.effect(
  Config.ApiKeyConfig.ApiKeyConfig,
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const apiKeysFilePath = yield* Config.Env.apiKeysFilePath

    const apiKeys = yield* pipe(
      fs.readFile(apiKeysFilePath),
      Effect.andThen(Schema.decode(ParseApiKeys)),
    )

    if (HashMap.size(apiKeys) === 0) {
      return yield* Effect.dieMessage("Parsed empty or invalid api keys")
    }

    return new ApiKeyConfigImpl(apiKeys)
  }),
)

class ApiKeyConfigImpl implements Config.ApiKeyConfig.ApiKeyConfigDef {
  #apiKeys: HashMap.HashMap<
    string,
    readonly [
      scopes: Schemas.ScopeGroups.ScopeOrGroupSet,
      email: string,
    ]
  >

  constructor(
    apiKeys: HashMap.HashMap<
      Redacted.Redacted<string>,
      readonly [
        scopes: Schemas.ScopeGroups.ScopeOrGroupSet,
        email: string,
      ]
    >,
  ) {
    this.#apiKeys = pipe(
      apiKeys,
      HashMap.toEntries,
      Array.map(Tuple.mapFirst(Redacted.value)),
      HashMap.fromIterable,
    )
  }

  getRoles(apiKey: string): Option.Option<Schemas.ScopeGroups.ScopeOrGroupSet> {
    return HashMap.get(this.#apiKeys, apiKey).pipe(
      Option.map(
        Tuple.getFirst,
      ),
    )
  }

  getEmail(apiKey: string): Option.Option<string> {
    return HashMap.get(this.#apiKeys, apiKey).pipe(
      Option.map(
        Tuple.getSecond,
      ),
    )
  }
}
