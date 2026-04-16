import { HttpApiEndpoint } from "@effect/platform"
import type { Types } from "effect"
import * as ApiErrors from "../../errors/http-errors.js"
import * as Schemas from "../../schemas/index.js"

export const TokenEndpoint = HttpApiEndpoint.post("token")`/token`
  .addSuccess(Schemas.OAuth.TokenResponse)
  .addError(ApiErrors.AuthenticationError)
  .addError(ApiErrors.BadRequest)
  .addError(ApiErrors.InternalServerError)

export type TokenEndpoint = typeof TokenEndpoint

export type TokenEndpointHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<TokenEndpoint>
>
