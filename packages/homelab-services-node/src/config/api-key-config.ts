import { FileSystem } from "@effect/platform"
import { Array, Data, Effect, flow, HashMap, HashSet, Layer, type Option, pipe, Schema, String, Tuple } from "effect"
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
          Array.map(
            flow(
              String.split(" "),
              ([apiKey, scopes]) =>
                pipe(
                  Data.tuple(
                    apiKey,
                    String.split(scopes, ","),
                  ),
                  Tuple.mapSecond(Array.map(String.trim)),
                  Tuple.mapSecond(HashSet.fromIterable),
                ),
            ),
          ),
        ),
      ),
      Effect.map(HashMap.fromIterable),
    )

    return new ApiKeyConfigImpl(apiKeys)
  }),
)

class ApiKeyConfigImpl implements Config.ApiKeyConfig.ApiKeyConfigDef {
  constructor(private readonly apiKeys: HashMap.HashMap<string, HashSet.HashSet<string>>) {}

  getRoles(apiKey: string): Option.Option<HashSet.HashSet<string>> {
    return HashMap.get(this.apiKeys, apiKey)
  }
}
