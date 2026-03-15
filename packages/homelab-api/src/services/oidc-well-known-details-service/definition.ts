import { Context } from "effect"
import type { OIDCWellKnown } from "../../schemas/OIDC.js"

export const OIDCWellKnownDetailsServiceId =
  "homelab-api/services/oidc-well-known-details-service/OIDCWellKnownDetailsService"

export class OIDCWellKnownDetailsService
  extends Context.Tag(OIDCWellKnownDetailsServiceId)<OIDCWellKnownDetailsService, OIDCWellKnown>()
{
}
