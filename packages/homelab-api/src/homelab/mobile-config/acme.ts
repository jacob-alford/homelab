import { HttpApiEndpoint, HttpApiError, HttpApiSchema } from "@effect/platform"
import type { Types } from "effect"
import { Schema } from "effect"
import { ApiErrors, Schemas } from "homelab-services"

export const AcmeQueryParams = null

export const ClientIdentifierParam = HttpApiSchema.param("clientIdentifier", Schema.String)

export const AcmeMobileConfig = HttpApiEndpoint.put("acme")`/acme/${ClientIdentifierParam}`
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
  ).setHeaders(
    Schemas.Token.TokenHeaders,
  )

export type AcmeMobileConfigEndpoint = typeof AcmeMobileConfig

export type AcmeMobileConfigHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<AcmeMobileConfigEndpoint>
>
