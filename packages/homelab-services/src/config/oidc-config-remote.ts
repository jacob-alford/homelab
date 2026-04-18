import { Context, Effect } from "effect"
import type { OIDCWellKnown } from "../schemas/OIDC.js"

export interface RemoteOIDCConfig {
  /** The fetched OIDC well-known configuration for the Kanidm identity provider. */
  kanidm: OIDCWellKnown
}

export type RemoteOIDCProviders = keyof RemoteOIDCConfig

export const RemoteOIDCWellKnownDetailsServiceId =
  "homelab-api/config/oidc-config-remote/RemoteOIDCWellKnownDetailsService"

export class RemoteOIDCWellKnownDetailsService
  extends Context.Tag(RemoteOIDCWellKnownDetailsServiceId)<RemoteOIDCWellKnownDetailsService, RemoteOIDCConfig>()
{
}

/** {@inheritDoc RemoteOIDCConfig.kanidm} */
export const kanidm = RemoteOIDCWellKnownDetailsService.pipe(Effect.map((_) => _.kanidm))
