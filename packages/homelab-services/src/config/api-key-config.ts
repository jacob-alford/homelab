import { Context, Effect, type HashSet, type Option } from "effect"

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
