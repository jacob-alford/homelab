import { HttpApiEndpoint, HttpApiError } from "@effect/platform"
import type { Types } from "effect"
import * as ApiErrors from "../../errors/http-errors.js"
import * as Schemas from "../../schemas/index.js"

declare module "../../resource.js" {
  enum Resource {
    "Config.Certs" = "Config.Certs",
  }
}

export const Certs = HttpApiEndpoint.get("certs")`/certs`
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

export type CertsEndpoint = typeof Certs

export type CertsHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<CertsEndpoint>
>
