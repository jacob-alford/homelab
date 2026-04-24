import { HttpApiEndpoint } from "@effect/platform"
import type { Types } from "effect"
import { ApiErrors, Schemas } from "homelab-services"

export const TokenEndpoint = HttpApiEndpoint.post("token")`/token`
  .addSuccess(Schemas.Token.TokenResponse)
  .addError(ApiErrors.AuthenticationError)
  .addError(ApiErrors.AuthorizationError)
  .addError(ApiErrors.BadRequest)
  .addError(ApiErrors.InternalServerError)
  .setHeaders(Schemas.Token.TokenHeaders)

export type TokenEndpoint = typeof TokenEndpoint

export type TokenEndpointHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<TokenEndpoint>
>
