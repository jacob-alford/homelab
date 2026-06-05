import { HttpApiEndpoint, HttpApiSchema } from "@effect/platform"
import type { Types } from "effect"
import { ApiErrors, Schemas } from "homelab-services"

export const FormatParam = HttpApiSchema.param("format", Schemas.CertFormat.CertFormat)

export const IntermediateCert = HttpApiEndpoint.get("intermediate")`/intermediate/${FormatParam}`
  .addSuccess(HttpApiSchema.Uint8Array())
  .addError(ApiErrors.AuthorizationError)
  .setHeaders(Schemas.Token.TokenHeaders)

export type IntermediateCertEndpoint = typeof IntermediateCert

export type IntermediateCertHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<IntermediateCertEndpoint>
>
