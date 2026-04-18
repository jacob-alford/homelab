import { HttpApiEndpoint, HttpApiError } from "@effect/platform"
import type { Types } from "effect"
import { ApiErrors, Schemas } from "homelab-services"
import { EncryptionParam, SSIDParam, WifiMobileConfigParams } from "./wifi.js"

export const WifiMobileConfigDownload = HttpApiEndpoint.get(
  "wifi-download",
)`/wifi/${SSIDParam}/${EncryptionParam}/_download`
  .setUrlParams(
    WifiMobileConfigParams,
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
    ApiErrors.AuthorizationError,
  )

export type WifiMobileConfigDownloadEndpoint = typeof WifiMobileConfigDownload

export type WifiMobileConfigDownloadHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<WifiMobileConfigDownloadEndpoint>
>
