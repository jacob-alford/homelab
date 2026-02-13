import { HttpApiEndpoint, HttpApiError, HttpApiSchema } from "@effect/platform"
import { InternalServerError, NotImplemented } from "@effect/platform/HttpApiError"
import type { Types } from "effect"
import { Schema } from "effect"
import { XMLSchema } from "homelab-api/schemas/XML"

export const WifiQueryParams = null

export const SSIDParam = HttpApiSchema.param("ssid", Schema.String)

export const WifiMobileConfigQueryParams = Schema.Struct({
  username: Schema.String,
  password: Schema.String,
  disableMACRandomization: Schema.BooleanFromString.pipe(
    Schema.optionalWith({ default: () => false }),
  ),
})

export const WifiMobileConfig = HttpApiEndpoint.post("wifi")`/wifi/${SSIDParam}`.setUrlParams(
  WifiMobileConfigQueryParams,
).addSuccess(XMLSchema, {
  status: 201,
}).addError(
  NotImplemented,
  { status: 501 },
).addError(
  InternalServerError,
  {
    status: 500,
  },
)

export type WifiMobileConfigEndpoint = typeof WifiMobileConfig

export type WifiMobileConfigHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<WifiMobileConfigEndpoint>
>

export const WifiMobileConfigDownload = HttpApiEndpoint.get("wifi-download")`/wifi/${SSIDParam}/_download`.setUrlParams(
  WifiMobileConfigQueryParams,
).addSuccess(XMLSchema).addError(
  HttpApiError.NotImplemented,
  {
    status: 501,
  },
).addError(
  InternalServerError,
  {
    status: 500,
  },
)

export type WifiMobileConfigDownloadEndpoint = typeof WifiMobileConfigDownload

export type WifiMobileConfigDownloadHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<WifiMobileConfigDownloadEndpoint>
>
