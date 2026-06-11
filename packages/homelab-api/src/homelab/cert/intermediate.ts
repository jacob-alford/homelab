import { HttpApiEndpoint, HttpApiSchema } from "@effect/platform"
import type { Types } from "effect"
import { ApiErrors, type ResourceURIs, Schemas } from "homelab-services"

export const URI = "Cert_Intermediate" satisfies ResourceURIs.ResourceURIs
export type URI = typeof URI

export const FormatParam = HttpApiSchema.param("format", Schemas.CertFormat.CertFormat)

export const IntermediateCert = HttpApiEndpoint.get("intermediate")`/intermediate/${FormatParam}`
  .addSuccess(HttpApiSchema.Uint8Array())
  .addError(ApiErrors.AuthorizationError)
  .setHeaders(Schemas.Token.TokenHeaders)

export type IntermediateCertEndpoint = typeof IntermediateCert

export type IntermediateCertHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<IntermediateCertEndpoint>
>

declare module "homelab-services/resource-uris" {
  interface URIToParams {
    [URI]: IntermediateCertHandlerArgs
  }
}
