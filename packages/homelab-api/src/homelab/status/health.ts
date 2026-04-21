import { HttpApiEndpoint } from "@effect/platform"
import type { Types } from "effect"
import { ApiErrors, Schemas } from "homelab-services"

export const HealthEndpoint = HttpApiEndpoint.put("health")`/health`
  .addSuccess(Schemas.Health.HealthResponseSchema)
  .addError(
    ApiErrors.HttpApiEncodeError,
  )
  .addError(
    ApiErrors.AuthorizationError,
  )
  .setHeaders(
    Schemas.Token.TokenHeaders,
  )

export type HealthEndpoint = typeof HealthEndpoint

export type HealthEndpointHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<HealthEndpoint>
>
