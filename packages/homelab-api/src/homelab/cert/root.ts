import { HttpApiEndpoint, HttpApiSchema } from "@effect/platform"
import type { Types } from "effect"
import { ApiErrors, type ResourceURIs, Schemas } from "homelab-services"

export const URI = "Cert_Root" satisfies ResourceURIs.ResourceURIs
export type URI = typeof URI

export const FormatParam = HttpApiSchema.param("format", Schemas.CertFormat.CertFormat)

export const RootCert = HttpApiEndpoint.get("root")`/root/${FormatParam}`
  .addSuccess(HttpApiSchema.Uint8Array())
  .addError(ApiErrors.AuthorizationError)
  .setHeaders(Schemas.Token.TokenHeaders)

export type RootCertEndpoint = typeof RootCert

export type RootCertHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<RootCertEndpoint>
>

declare module "homelab-services/resource-uris" {
  interface URIToParams {
    [URI]: RootCertHandlerArgs
  }
}
