import { HttpApiEndpoint, HttpApiError } from "@effect/platform"
import type { Types } from "effect"
import { ApiErrors, Schemas } from "homelab-services"

export const Certs = HttpApiEndpoint.get("certs")`/certs`
  .addSuccess(Schemas.XML.XMLSchema)
  .addError(
    ApiErrors.NotImplemented,
  )
  .addError(
    ApiErrors.InternalServerError,
  )
  .addError(
    ApiErrors.BadRequest,
  )
  .addError(
    ApiErrors.NotFound,
  )
  .addError(
    HttpApiError.HttpApiDecodeError,
  )
  .addError(
    ApiErrors.AuthorizationError,
  )
  .setHeaders(
    Schemas.Token.TokenHeaders,
  )

export type CertsEndpoint = typeof Certs

export type CertsHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<CertsEndpoint>
>
