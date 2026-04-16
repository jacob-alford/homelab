import { Layer } from "effect"
import { ApiKeyConfigLive } from "./api-key-config.js"
import { IssuerJwkResolverLive } from "./issuer-jwk-resolver-jose.js"
import { RemoteOIDCWellKnownDetailsServiceLive } from "./oidc-config-remote.js"

export * as ApiKeyConfig from "./api-key-config.js"
export * as Env from "./env.js"
export * as IssuerJwkResolverJose from "./issuer-jwk-resolver-jose.js"
export * as OIDCConfigRemote from "./oidc-config-remote.js"
export * as ProfileUuidConfig from "./profile-uuid-config.js"

export const ConfigLive = Layer.mergeAll(
  ApiKeyConfigLive,
  IssuerJwkResolverLive.pipe(Layer.provide(RemoteOIDCWellKnownDetailsServiceLive)),
)
