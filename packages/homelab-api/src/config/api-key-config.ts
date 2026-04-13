import { FileSystem } from "@effect/platform"
import {
  Array,
  Config,
  Context,
  Data,
  Effect,
  flow,
  HashMap,
  HashSet,
  Layer,
  type Option,
  pipe,
  Schema,
  String,
  Tuple,
} from "effect"
import { StringFromUint8Array } from "../schemas/Buffer.js"

export const ApiKeyConfigId = "homelab-api/config/api-key-config/ApiKeyConfig"

export interface ApiKeyConfigDef {
  readonly getRoles: (apiKey: string) => Option.Option<HashSet.HashSet<string>>
}

export class ApiKeyConfig extends Context.Tag(ApiKeyConfigId)<ApiKeyConfig, ApiKeyConfigDef>() {}

/**
 * Reads API_KEYS_FILE and then parses it according to the following format:
 *
 * @example
 * apikey-1234 roleA,roleB,roleC
 * apikey-5678 roleB,roleD
 */
export const ApiKeyConfigLive = Layer.effect(
  ApiKeyConfig,
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const apiKeysFilePath = yield* Config.string("API_KEYS_FILE")

    const apiKeys = yield* pipe(
      fs.readFile(apiKeysFilePath),
      Effect.andThen(Schema.decode(StringFromUint8Array)),
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

class ApiKeyConfigImpl implements ApiKeyConfigDef {
  constructor(private readonly apiKeys: HashMap.HashMap<string, HashSet.HashSet<string>>) {}

  getRoles(apiKey: string): Option.Option<HashSet.HashSet<string>> {
    return HashMap.get(this.apiKeys, apiKey)
  }
}
