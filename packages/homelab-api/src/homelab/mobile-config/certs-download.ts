import { HttpApiEndpoint, HttpApiError } from "@effect/platform"
import type { Types } from "effect"
import { ApiErrors, Schemas } from "homelab-services"

export const CertsDownload = HttpApiEndpoint.get("certs-download")`/certs/_download`
  .addSuccess(Schemas.XML.XMLSchema)
  .addError(ApiErrors.NotImplemented)
  .addError(ApiErrors.InternalServerError)
  .addError(ApiErrors.BadRequest)
  .addError(ApiErrors.NotFound)
  .addError(HttpApiError.HttpApiDecodeError)
  .addError(ApiErrors.AuthorizationError)
  .setHeaders(Schemas.Token.TokenHeaders)
  .setUrlParams(
    Schemas.Token.AuthQueryParams,
  )

export type CertsDownloadEndpoint = typeof CertsDownload

export type CertsDownloadHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<CertsDownloadEndpoint>
>
