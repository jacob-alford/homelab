import { Context, Effect, Layer } from "effect"
import { Constants } from "homelab-shared"
import type { OIDCProviders } from "../oidc-providers.js"
import { RemoteOIDCWellKnownDetailsService, RemoteOIDCWellKnownDetailsServiceLive } from "./oidc-config-remote.js"

export const OIDCIssuerResolverId = "homelab-api/config/oidc-issuer-resolver/OIDCIssuerResolver"

export type OIDCIssuerResolverDef = {
  [K in OIDCProviders]: string
}

export class OIDCIssuerResolver extends Context.Tag(OIDCIssuerResolverId)<OIDCIssuerResolver, OIDCIssuerResolverDef>() {
}

export const OIDCIssuerResolverLive = Layer.effect(
  OIDCIssuerResolver,
  Effect.gen(function*() {
    const oidcConfig = yield* RemoteOIDCWellKnownDetailsService

    return {
      kanidm: oidcConfig.kanidm.issuer,
      homelab: Constants.JWT_HOMELAB_API_ISSUER,
      tests: Constants.JWT_HOMELAB_API_ISSUER,
    }
  }),
).pipe(
  Layer.provide(RemoteOIDCWellKnownDetailsServiceLive),
)
