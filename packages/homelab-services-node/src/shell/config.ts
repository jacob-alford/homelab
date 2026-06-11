import { Layer } from "effect"
import { ApiKeyConfigLive } from "../config/api-key-config.js"
import { IssuerJwkResolverLive } from "../config/issuer-jwk-resolver.js"
import { RemoteOIDCWellKnownDetailsServiceLive } from "../config/oidc-config-remote.js"
import { SerialNumberConfigLive } from "../config/serial-number-config.js"

export const ConfigLive = Layer.mergeAll(
  ApiKeyConfigLive,
  IssuerJwkResolverLive.pipe(Layer.provide(RemoteOIDCWellKnownDetailsServiceLive)),
  SerialNumberConfigLive,
)
