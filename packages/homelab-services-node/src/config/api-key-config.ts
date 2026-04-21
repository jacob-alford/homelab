import { FileSystem } from "@effect/platform"
import { Array, Data, Effect, flow, HashMap, HashSet, Layer, Option, pipe, Schema, String, Tuple } from "effect"
import { Config, Schemas } from "homelab-services"

export const ApiKeyConfigLive = Layer.effect(
  Config.ApiKeyConfig.ApiKeyConfig,
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const apiKeysFilePath = yield* Config.Env.apiKeysFilePath

    const apiKeys = yield* pipe(
      fs.readFile(apiKeysFilePath),
      Effect.andThen(Schema.decode(Schemas.Buffer.StringFromUint8Array)),
      Effect.map(
        flow(
          String.split("\n"),
          Array.map(String.trim),
          Array.filter((line) => line.length > 0),
          Array.filterMap(String.match(/^(\S+) (\S+) (\S+)$/)),
          Array.map(
            ([, apiKey, scopes, email]) =>
              Data.tuple(
                apiKey,
                Data.tuple(
                  pipe(
                    scopes,
                    String.split(","),
                    Array.map(String.trim),
                    HashSet.fromIterable,
                  ),
                  String.trim(email),
                ),
              ),
          ),
        ),
      ),
      Effect.map(HashMap.fromIterable),
    )

    if (HashMap.size(apiKeys) === 0) {
      return yield* Effect.dieMessage("Parsed empty or invalid api keys")
    }

    return new ApiKeyConfigImpl(apiKeys)
  }),
)

class ApiKeyConfigImpl implements Config.ApiKeyConfig.ApiKeyConfigDef {
  constructor(
    private readonly apiKeys: HashMap.HashMap<
      string,
      readonly [
        scopes: HashSet.HashSet<string>,
        email: string,
      ]
    >,
  ) {}

  getRoles(apiKey: string): Option.Option<HashSet.HashSet<string>> {
    return HashMap.get(this.apiKeys, apiKey).pipe(
      Option.map(
        Tuple.getFirst,
      ),
    )
  }

  getEmail(apiKey: string): Option.Option<string> {
    return HashMap.get(this.apiKeys, apiKey).pipe(
      Option.map(
        Tuple.getSecond,
      ),
    )
  }
}
