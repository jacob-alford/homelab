import { HttpApiEndpoint } from "@effect/platform"
import type { Types } from "effect"
import { ApiErrors, Middleware, type ResourceURIs, Schemas } from "homelab-services"

export const URI = "OAuth_Token" satisfies ResourceURIs.ResourceURIs
export type URI = typeof URI

export const TokenEndpoint = HttpApiEndpoint.post("token")`/token`
  .addSuccess(Schemas.Token.TokenResponse)
  .addError(ApiErrors.AuthenticationError)
  .addError(ApiErrors.AuthorizationError)
  .addError(ApiErrors.BadRequest)
  .addError(ApiErrors.InternalServerError)
  .setHeaders(Schemas.Token.TokenHeaders)
  .middleware(Middleware.BasicAuthMiddleware)

export type TokenEndpoint = typeof TokenEndpoint

export type TokenEndpointHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<TokenEndpoint>
>

declare module "homelab-services/resource-uris" {
  interface URIToParams {
    [URI]: TokenEndpointHandlerArgs
  }
}
