import { Layer } from "effect"
import { AuthenticationServiceLive } from "../layers/authentication-service.js"
import { OIDCAuthenticationServiceLive } from "../layers/oidc-authentication-service.js"

export const Aggregate = AuthenticationServiceLive.pipe(
  Layer.provide(OIDCAuthenticationServiceLive),
)
