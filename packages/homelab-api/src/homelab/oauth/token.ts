import { HttpApiEndpoint } from "@effect/platform"
import type { Types } from "effect"
import { ApiErrors, Schemas } from "homelab-services"

export const TokenEndpoint = HttpApiEndpoint.post("token")`/token`
  .addSuccess(Schemas.Token.TokenResponse)
  .addError(ApiErrors.AuthenticationError)
  .addError(ApiErrors.BadRequest)
  .addError(ApiErrors.InternalServerError)

export type TokenEndpoint = typeof TokenEndpoint

export type TokenEndpointHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<TokenEndpoint>
>
