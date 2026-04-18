import { HttpApiEndpoint, HttpApiError } from "@effect/platform"
import type { Types } from "effect"
import { ApiErrors, Schemas } from "homelab-services"

import { ClientIdentifierParam } from "./acme.js"

export const AcmeDownloadMobileConfig = HttpApiEndpoint.get("acme-download")`/acme/${ClientIdentifierParam}/_download`
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

export type AcmeDownloadMobileConfigEndpoint = typeof AcmeDownloadMobileConfig

export type AcmeDownloadMobileConfigHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<AcmeDownloadMobileConfigEndpoint>
>
