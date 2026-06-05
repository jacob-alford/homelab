import { HttpApiEndpoint, HttpApiSchema } from "@effect/platform"
import type { Types } from "effect"
import { ApiErrors, Schemas } from "homelab-services"

export const FormatParam = HttpApiSchema.param("format", Schemas.CertFormat.CertFormat)

export const RootCert = HttpApiEndpoint.get("root")`/root/${FormatParam}`
  .addSuccess(HttpApiSchema.Uint8Array())
  .addError(ApiErrors.AuthorizationError)
  .setHeaders(Schemas.Token.TokenHeaders)

export type RootCertEndpoint = typeof RootCert

export type RootCertHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<RootCertEndpoint>
>
