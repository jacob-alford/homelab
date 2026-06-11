import { HttpApiEndpoint } from "@effect/platform"
import type { Types } from "effect"
import { Schema } from "effect"
import { ApiErrors, Schemas } from "homelab-services"

const SelfHeaders = Schema.Struct({
  ...Schemas.Token.TokenHeaders.fields,
  "x-forwarded-for": Schema.optionalWith(Schema.String, { exact: true }),
})

export const SelfEndpoint = HttpApiEndpoint.get("self")`/self`
  .addSuccess(Schemas.StatusSelf.StatusSelfResponseSchema)
  .addError(ApiErrors.AuthorizationError)
  .addError(ApiErrors.InternalServerError)
  .setHeaders(SelfHeaders)

export type SelfEndpoint = typeof SelfEndpoint

export type SelfEndpointHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<SelfEndpoint>
>
