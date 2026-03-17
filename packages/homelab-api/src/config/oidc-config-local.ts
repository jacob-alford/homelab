import { Context } from "effect"

export interface LocalOIDCConfig {
  homelab: string
  tests: string
}

export type LocalOIDCProviders = keyof LocalOIDCConfig

export const LocalOIDCProviderPathMapId = "homelab-api/config/oidc-config-local/LocalOIDCProviderPathMap"

export type LocalOIDCProviderPathMapDef = {
  [K in keyof LocalOIDCConfig]: string
}

export class LocalOIDCProviderPathMap
  extends Context.Tag(LocalOIDCProviderPathMapId)<LocalOIDCProviderPathMap, LocalOIDCProviderPathMapDef>()
{
}
