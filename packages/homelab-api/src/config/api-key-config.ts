import { FileSystem } from "@effect/platform"
import {
  Array,
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
import * as Env from "./env.js"

export const ApiKeyConfigId = "homelab-api/config/api-key-config/ApiKeyConfig"

export interface ApiKeyConfigDef {
  /** Returns the set of roles associated with the given API key, or `None` if the key is unrecognized. */
  readonly getRoles: (apiKey: string) => Option.Option<HashSet.HashSet<string>>
}

export class ApiKeyConfig extends Context.Tag(ApiKeyConfigId)<ApiKeyConfig, ApiKeyConfigDef>() {}

/** {@inheritDoc ApiKeyConfigDef.getRoles} */
export function getRoles(
  apiKey: string,
): Effect.Effect<Option.Option<HashSet.HashSet<string>>, never, ApiKeyConfig> {
  return ApiKeyConfig.pipe(Effect.map((_) => _.getRoles(apiKey)))
}

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
    const apiKeysFilePath = yield* Env.apiKeysFilePath

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
