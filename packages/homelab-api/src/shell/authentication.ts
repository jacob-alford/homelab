import { Layer } from "effect"
import { AuthenticationServiceLive } from "../services/authentication-service/layer.js"
import { OIDCAuthenticationServiceLive } from "../services/oidc-authentication-service/layer.js"

export const Aggregate = AuthenticationServiceLive.pipe(
  Layer.provide(OIDCAuthenticationServiceLive),
)
