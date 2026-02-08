import { HttpApiEndpoint, HttpApiError, HttpApiSchema } from "@effect/platform"
import { NotImplemented } from "@effect/platform/HttpApiError"
import { Schema } from "effect"
import { XMLSchema } from "homelab-api/schemas/XML"

export const WifiQueryParams = null

export const SSIDParam = HttpApiSchema.param("ssid", Schema.String)

export const WifiMobileConfigQueryParams = Schema.Struct({
  p: Schema.String,
})

export const WifiMobileConfig = HttpApiEndpoint.post("wifi")`/wifi/${SSIDParam}`.setUrlParams(
  WifiMobileConfigQueryParams,
).addSuccess(XMLSchema, {
  status: 201,
}).addError(
  NotImplemented,
  { status: 501 },
)

export const WifiMobileConfigDownload = HttpApiEndpoint.get("wifi-download")`/wifi/${SSIDParam}/_download`.setUrlParams(
  WifiMobileConfigQueryParams,
).addSuccess(XMLSchema).addError(
  HttpApiError.NotImplemented,
  {
    status: 501,
  },
)
