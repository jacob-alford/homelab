import { HttpApiGroup } from "@effect/platform"
import { Middleware } from "homelab-services"
import * as Health from "./health.js"

export const StatusApi = HttpApiGroup.make("status")
  .add(Health.HealthEndpoint)
  .prefix("/status")
  .middleware(Middleware.AuthMiddleware)

export * as Health from "./health.js"
