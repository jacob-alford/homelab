import { HttpApiGroup } from "@effect/platform"
import { AuthMiddleware } from "../../middleware/bearer-auth-middleware.js"
import * as Health from "./health.js"

export const StatusApi = HttpApiGroup.make("status")
  .add(Health.HealthEndpoint)
  .prefix("/status")
  .middleware(AuthMiddleware)

export * as Health from "./health.js"
