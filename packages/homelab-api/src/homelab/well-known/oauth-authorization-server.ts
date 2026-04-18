import { HttpApiEndpoint } from "@effect/platform"
import type { Types } from "effect"
import { Schemas } from "homelab-services"

export const OAuthAuthorizationWellKnownEndpoint = HttpApiEndpoint.get(
  "well-known-oauth-authorization",
)`/oauth-authorization-server`
  .addSuccess(Schemas.WellKnown.OAuthAuthorizationServerWellKnown)

export type OAuthAuthorizationWellKnownEndpoint = typeof OAuthAuthorizationWellKnownEndpoint

export type HealthEndpointHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<OAuthAuthorizationWellKnownEndpoint>
>
