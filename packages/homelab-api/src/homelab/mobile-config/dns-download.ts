import { HttpApiEndpoint, HttpApiError } from "@effect/platform"
import type { Types } from "effect"
import { ApiErrors, Schemas } from "homelab-services"
import { DnsProfileParam, DnsQueryParams } from "./dns.js"

export const DnsDownload = HttpApiEndpoint.get("dns-download")`/dns/${DnsProfileParam}/_download`
  .addSuccess(Schemas.XML.XMLSchema)
  .addError(ApiErrors.InternalServerError)
  .addError(ApiErrors.BadRequest)
  .addError(ApiErrors.AuthorizationError)
  .addError(HttpApiError.HttpApiDecodeError)
  .setHeaders(Schemas.Token.TokenHeaders)
  .setUrlParams(DnsQueryParams)

export type DnsDownloadEndpoint = typeof DnsDownload

export type DnsDownloadHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<DnsDownloadEndpoint>
>
