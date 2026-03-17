import type { LocalOIDCProviders } from "./config/oidc-config-local.js"
import type { RemoteOIDCProviders } from "./config/oidc-config-remote.js"

export type OIDCProviders = LocalOIDCProviders | RemoteOIDCProviders

export function isRemoteProvider(provider: OIDCProviders): provider is RemoteOIDCProviders {
  return provider === "kanidm"
}
