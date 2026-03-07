import { HttpApiEndpoint, HttpApiError, HttpApiSchema } from "@effect/platform"
import type { Types } from "effect"
import { Schema } from "effect"
import * as ApiErrors from "../../errors/http-errors.js"
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

export const WifiMobileConfig = HttpApiEndpoint.put("wifi")`/wifi/${SSIDParam}/${EncryptionParam}`
  .setPayload(
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

export type WifiMobileConfigEndpoint = typeof WifiMobileConfig

export type WifiMobileConfigHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<WifiMobileConfigEndpoint>
>
