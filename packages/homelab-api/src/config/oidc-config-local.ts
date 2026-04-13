import { Config, Context, Effect, Layer, type Option, Schema } from "effect"

export interface LocalOIDCConfig {
  homelab: Option.Option<string>
  testing: Option.Option<string>
}

export const LocalOIDCProvidersSchema = Schema.Literal(
  ...["homelab", "testing"] satisfies ReadonlyArray<keyof LocalOIDCConfig>,
)

export type LocalOIDCProviders = keyof LocalOIDCConfig

export const LocalOIDCProviderPathMapId = "homelab-api/config/oidc-config-local/LocalOIDCProviderPathMap"

export class LocalOIDCProviderPathMap
  extends Context.Tag(LocalOIDCProviderPathMapId)<LocalOIDCProviderPathMap, LocalOIDCConfig>()
{
}

export const LocalOIDCEnvLayer = Layer.effect(
  LocalOIDCProviderPathMap,
  Effect.gen(function*() {
    const homelab = yield* Config.option(Config.string("HOMELAB_JWK_PRIVATE_KEY_PATH"))
    const testing = yield* Config.option(Config.string("TESTING_JWK_PRIVATE_KEY_PATH"))

    return {
      homelab,
      testing,
    }
  }),
)
