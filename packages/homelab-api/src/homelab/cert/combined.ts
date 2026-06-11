import { HttpApiEndpoint, HttpApiSchema } from "@effect/platform"
import type { Types } from "effect"
import { ApiErrors, type ResourceURIs, Schemas } from "homelab-services"

export const URI = "Cert_Combined" satisfies ResourceURIs.ResourceURIs
export type URI = typeof URI

export const CombinedCert = HttpApiEndpoint.get("combined")`/combined`
  .addSuccess(HttpApiSchema.Uint8Array())
  .addError(ApiErrors.AuthorizationError)
  .setHeaders(Schemas.Token.TokenHeaders)

export type CombinedCertEndpoint = typeof CombinedCert

export type CombinedCertHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<CombinedCertEndpoint>
>

declare module "homelab-services/resource-uris" {
  interface URIToParams {
    [URI]: CombinedCertHandlerArgs
  }
}
