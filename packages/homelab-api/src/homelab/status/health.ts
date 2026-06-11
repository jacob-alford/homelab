import { HttpApiEndpoint } from "@effect/platform"
import type { Types } from "effect"
import { ApiErrors, type ResourceURIs, Schemas } from "homelab-services"

export const URI = "Status_Health" satisfies ResourceURIs.ResourceURIs
export type URI = typeof URI

export const HealthEndpoint = HttpApiEndpoint.get("health")`/health`
  .addSuccess(Schemas.Health.HealthResponseSchema)
  .addError(
    ApiErrors.HttpApiEncodeError,
  )
  .addError(
    ApiErrors.AuthorizationError,
  )
  .setHeaders(
    Schemas.Token.TokenHeaders,
  )

export type HealthEndpoint = typeof HealthEndpoint

export type HealthEndpointHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<HealthEndpoint>
>

declare module "homelab-services/resource-uris" {
  interface URIToParams {
    [URI]: HealthEndpointHandlerArgs
  }
}
