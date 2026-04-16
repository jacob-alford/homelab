import type { RemoteOIDCProviders } from "./config/oidc-config-remote.js"

export type OIDCProviders = RemoteOIDCProviders

export function isRemoteProvider(provider: OIDCProviders): provider is RemoteOIDCProviders {
  return provider === "kanidm"
}
