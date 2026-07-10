import { HttpApiEndpoint, HttpApiError } from "@effect/platform"
import type { Types } from "effect"
import { ApiErrors, type ResourceURIs, Schemas } from "homelab-services"

export const URI = "Config_Certs" satisfies ResourceURIs.ResourceURIs
export type URI = typeof URI

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
    ApiErrors.HttpApiEncodeError,
  )
  .addError(
    ApiErrors.AuthorizationError,
  )
  .addError(
    ApiErrors.AuthenticationError,
  )
  .setHeaders(
    Schemas.Token.TokenHeaders,
  )
  .setUrlParams(
    Schemas.Token.AuthQueryParams,
  )

export type CertsEndpoint = typeof Certs

export type CertsHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<CertsEndpoint>
>

declare module "homelab-services/resource-uris" {
  interface URIToParams {
    [URI]: CertsHandlerArgs
  }
}
