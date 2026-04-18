import { HttpApiEndpoint } from "@effect/platform"
import type { Types } from "effect"
import { ApiErrors, Schemas } from "homelab-services"

export const HealthEndpoint = HttpApiEndpoint.put("health")`/health`
  .addSuccess(Schemas.Health.HealthResponseSchemaWire)
  .addError(
    ApiErrors.HttpApiEncodeError,
  )
  .addError(
    ApiErrors.AuthorizationError,
  )

export type HealthEndpoint = typeof HealthEndpoint

export type HealthEndpointHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<HealthEndpoint>
>
