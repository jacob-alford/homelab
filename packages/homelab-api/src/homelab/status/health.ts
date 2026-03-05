import { HttpApiEndpoint } from "@effect/platform"
import type { Types } from "effect"
import * as ApiErrors from "../../errors/http-errors.js"
import * as Schemas from "../../schemas/index.js"

declare module "../../resource.js" {
  enum Resource {
    "Status.Health" = "Status.Health",
  }
}

export const HealthEndpoint = HttpApiEndpoint.put("health")`/health`
  .addSuccess(Schemas.Health.HealthResponseSchemaWire)
  .addError(
    ApiErrors.HttpApiEncodeError,
  )

export type HealthEndpoint = typeof HealthEndpoint

export type HealthEndpointHandlerArgs = Types.Simplify<
  HttpApiEndpoint.HttpApiEndpoint.Request<HealthEndpoint>
>
