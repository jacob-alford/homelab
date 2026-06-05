import { HttpApiEndpoint, HttpApiSchema } from "@effect/platform"
import type { Types } from "effect"
import { ApiErrors, Schemas } from "homelab-services"

export const CombinedCert = HttpApiEndpoint.get("combined")`/combined`
  .addSuccess(HttpApiSchema.Uint8Array())
  .addError(ApiErrors.AuthorizationError)
  .setHeaders(Schemas.Token.TokenHeaders)

export type CombinedCertEndpoint = typeof CombinedCert

export type CombinedCertHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<CombinedCertEndpoint>
>
