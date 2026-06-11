import { HttpApiEndpoint } from "@effect/platform"
import type { Types } from "effect"
import { ApiErrors, type ResourceURIs, Schemas } from "homelab-services"

export const URI = "Status_Self" satisfies ResourceURIs.ResourceURIs
export type URI = typeof URI

export const SelfEndpoint = HttpApiEndpoint.get("self")`/self`
  .addSuccess(Schemas.StatusSelf.StatusSelfResponseSchema)
  .addError(ApiErrors.AuthorizationError)
  .addError(ApiErrors.InternalServerError)
  .setHeaders(Schemas.Token.TokenHeaders)

export type SelfEndpoint = typeof SelfEndpoint

export type SelfEndpointHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<SelfEndpoint>
>

declare module "homelab-services/resource-uris" {
  interface URIToParams {
    [URI]: SelfEndpointHandlerArgs
  }
}
