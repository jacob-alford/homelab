import { HttpApiEndpoint, HttpApiError } from "@effect/platform"
import { Schema, type Types } from "effect"
import { ApiErrors, Schemas } from "homelab-services"
import { EncryptionParam, SSIDParam, WifiMobileConfigParams } from "./wifi.js"

export const WifiMobileConfigDownloadParams = WifiMobileConfigParams.pipe(
  Schema.extend(Schemas.Token.AuthQueryParams),
)

export const WifiMobileConfigDownload = HttpApiEndpoint.get(
  "wifi-download",
)`/wifi/${SSIDParam}/${EncryptionParam}/_download`
  .setUrlParams(
    WifiMobileConfigDownloadParams,
  )
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
    ApiErrors.AuthenticationError,
  )
  .addError(
    ApiErrors.AuthorizationError,
  ).setHeaders(
    Schemas.Token.TokenHeaders,
  )

export type WifiMobileConfigDownloadEndpoint = typeof WifiMobileConfigDownload

export type WifiMobileConfigDownloadHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<WifiMobileConfigDownloadEndpoint>
>
