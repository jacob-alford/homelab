import { HttpApiEndpoint, HttpApiError, HttpApiSchema } from "@effect/platform"
import type { Types } from "effect"
import { Schema } from "effect"
import * as ApiErrors from "../../errors/http-errors.js"
import * as Schemas from "../../schemas/index.js"

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
  )

export type AcmeMobileConfigEndpoint = typeof AcmeMobileConfig

export type AcmeMobileConfigHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<AcmeMobileConfigEndpoint>
>

declare module "../../resource-uris.js" {
  interface URIToParams {
    readonly [`Config.ACME`]: AcmeMobileConfigHandlerArgs
  }
}
