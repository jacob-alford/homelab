import { HttpApiEndpoint, HttpApiError, HttpApiSchema } from "@effect/platform"
import type { Types } from "effect"
import { Schema } from "effect"
import { ApiErrors, type ResourceURIs, Schemas } from "homelab-services"

export const URI = "Config_DNS" satisfies ResourceURIs.ResourceURIs
export type URI = typeof URI

export const DnsProfileParam = HttpApiSchema.param("profile", Schemas.DnsProfile.DnsProfileSchema)

export const DnsQueryParams = Schemas.Token.AuthQueryParams.pipe(
  Schema.extend(Schema.Struct({
    name: Schemas.Optionals.Optional(Schema.String),
    ssid: Schemas.Optionals.Optional(Schema.String),
  })),
)

export const Dns = HttpApiEndpoint.get("dns")`/dns/${DnsProfileParam}`
  .addSuccess(Schemas.XML.XMLSchema)
  .addError(ApiErrors.InternalServerError)
  .addError(ApiErrors.BadRequest)
  .addError(ApiErrors.AuthorizationError)
  .addError(
    ApiErrors.AuthenticationError,
  )
  .addError(HttpApiError.HttpApiDecodeError)
  .addError(
    ApiErrors.HttpApiEncodeError,
  )
  .setHeaders(Schemas.Token.TokenHeaders)
  .setUrlParams(DnsQueryParams)

export type DnsEndpoint = typeof Dns

export type DnsHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<DnsEndpoint>
>

declare module "homelab-services/resource-uris" {
  interface URIToParams {
    [URI]: DnsHandlerArgs
  }
}
