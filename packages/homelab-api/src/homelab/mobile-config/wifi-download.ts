import { HttpApiEndpoint, HttpApiError } from "@effect/platform"
import type { Types } from "effect"
import * as ApiErrors from "../../errors/http-errors.js"
import * as Schemas from "../../schemas/index.js"
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

export type WifiMobileConfigDownloadEndpoint = typeof WifiMobileConfigDownload

export type WifiMobileConfigDownloadHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<WifiMobileConfigDownloadEndpoint>
>
