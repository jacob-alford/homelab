import { HttpApiEndpoint } from "@effect/platform"
import type { Types } from "effect"
import { ApiErrors, Middleware, Schemas } from "homelab-services"

export const ClaimCheckEndpoint = HttpApiEndpoint.post("claim-check")`/claim-check`
  .addSuccess(Schemas.ClaimCheck.ClaimCheckResponse)
  .addError(ApiErrors.AuthenticationError)
  .addError(ApiErrors.AuthorizationError)
  .addError(ApiErrors.InternalServerError)
  .setHeaders(Schemas.Token.TokenHeaders)
  .middleware(Middleware.AuthMiddleware)

export type ClaimCheckEndpoint = typeof ClaimCheckEndpoint

export type ClaimCheckEndpointHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<ClaimCheckEndpoint>
>
