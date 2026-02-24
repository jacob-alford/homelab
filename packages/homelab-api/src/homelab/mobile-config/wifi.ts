import { HttpApiEndpoint, HttpApiError, HttpApiSchema } from "@effect/platform"
import { BadRequest, InternalServerError, NotFound, NotImplemented } from "@effect/platform/HttpApiError"
import type { Types } from "effect"
import { Schema } from "effect"
import * as Schemas from "../../schemas/index.js"

export const WifiQueryParams = null

export const SSIDParam = HttpApiSchema.param("ssid", Schema.String)

export const EncryptionParam = HttpApiSchema.param("encryption", Schema.Literal("WPA3", "WPA2"))

export const WifiMobileConfigParams = Schema.Struct({
  username: Schema.String.pipe(
    Schema.optionalWith({
      exact: true,
    }),
  ),
  password: Schema.String,
  disableMACRandomization: Schema.BooleanFromString.pipe(
    Schema.optionalWith({ exact: true, default: () => false }),
  ),
  enterpriseClientType: Schemas.WifiConfig.EnterpriseClientConfigurationType.pipe(
    Schema.optionalWith({
      exact: true,
    }),
  ),
})

export const WifiMobileConfig = HttpApiEndpoint.post("wifi")`/wifi/${SSIDParam}/${EncryptionParam}`
  .setPayload(
    WifiMobileConfigParams,
  ).addSuccess(Schemas.XML.XMLSchema, {
    status: 201,
  }).addError(
    NotImplemented,
    { status: 501 },
  ).addError(
    InternalServerError,
    {
      status: 500,
    },
  ).addError(
    BadRequest,
    { status: 400 },
  ).addError(
    NotFound,
    { status: 404 },
  )

export type WifiMobileConfigEndpoint = typeof WifiMobileConfig

export type WifiMobileConfigHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<WifiMobileConfigEndpoint>
>

export const WifiMobileConfigDownload = HttpApiEndpoint.get(
  "wifi-download",
)`/wifi/${SSIDParam}/${EncryptionParam}/_download`.setUrlParams(
  WifiMobileConfigParams,
).addSuccess(Schemas.XML.XMLSchema).addError(
  HttpApiError.NotImplemented,
  {
    status: 501,
  },
).addError(
  InternalServerError,
  {
    status: 500,
  },
).addError(
  BadRequest,
  { status: 400 },
).addError(
  NotFound,
  { status: 404 },
)

export type WifiMobileConfigDownloadEndpoint = typeof WifiMobileConfigDownload

export type WifiMobileConfigDownloadHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<WifiMobileConfigDownloadEndpoint>
>
