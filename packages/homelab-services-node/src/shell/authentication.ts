import { Layer } from "effect"
import { AuthenticationServiceLive } from "../layers/authentication-service.js"
import { ClaimCheckServiceLive } from "../layers/claim-check-service.js"
import { OIDCAuthenticationServiceLive } from "../layers/oidc-authentication-service.js"
import { TokenIssuerServiceLive } from "../layers/token-issuer-service.js"

export const Aggregate = AuthenticationServiceLive.pipe(
  Layer.provide(OIDCAuthenticationServiceLive),
  Layer.provideMerge(ClaimCheckServiceLive),
  Layer.provideMerge(TokenIssuerServiceLive),
)
