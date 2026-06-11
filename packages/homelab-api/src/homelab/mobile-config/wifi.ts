import { HttpApiEndpoint, HttpApiError, HttpApiSchema } from "@effect/platform"
import type { Types } from "effect"
import { Schema } from "effect"
import { ApiErrors, type ResourceURIs, Schemas } from "homelab-services"

export const URI = "Config_Wifi" satisfies ResourceURIs.ResourceURIs
export type URI = typeof URI

export const WifiQueryParams = null

export const SSIDParam = HttpApiSchema.param("ssid", Schema.String)

export const EncryptionParam = HttpApiSchema.param("encryption", Schema.Literal("WPA3", "WPA2"))

export const WifiMobileConfigParamsBase = Schema.Struct({
  disableMACRandomization: Schemas.Optionals.OptionalWithDefault(
    Schema.BooleanFromString,
    () => false,
  ),
})

export const WifiMobileConfigParamsEnterprisePEAP = WifiMobileConfigParamsBase.pipe(
  Schema.extend(
    Schema.Struct({
      username: Schema.String,
      enterpriseClientType: Schema.Literal("PEAP"),
      password: Schema.String,
    }),
  ),
)

export const WifiMobileConfigParamsEnterpriseEAPTLS = WifiMobileConfigParamsBase.pipe(
  Schema.extend(
    Schema.Struct({
      enterpriseClientType: Schema.Literal("EAP-TLS"),
    }),
  ),
)

export const WifiMobileConfigParamsPersonal = WifiMobileConfigParamsBase.pipe(
  Schema.extend(
    Schema.Struct({
      enterpriseClientType: Schema.Literal("None"),
      password: Schema.String,
    }),
  ),
)

export const WifiMobileConfigParams = Schema.Union(
  WifiMobileConfigParamsPersonal,
  WifiMobileConfigParamsEnterprisePEAP,
  WifiMobileConfigParamsEnterpriseEAPTLS,
)

export type WifiMobileConfigParamsWire = typeof WifiMobileConfigParams.Encoded
export type WifiMobileConfigParams = typeof WifiMobileConfigParams.Type

export const WifiMobileConfig = HttpApiEndpoint.put("wifi")`/wifi/${SSIDParam}/${EncryptionParam}`
  .setPayload(
    WifiMobileConfigParams,
  )
  .setUrlParams(
    Schemas.Token.AuthQueryParams,
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
  .setHeaders(
    Schemas.Token.TokenHeaders,
  )

export type WifiMobileConfigEndpoint = typeof WifiMobileConfig

export type WifiMobileConfigHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<WifiMobileConfigEndpoint>
>

declare module "homelab-services/resource-uris" {
  interface URIToParams {
    [URI]: WifiMobileConfigHandlerArgs
  }
}
