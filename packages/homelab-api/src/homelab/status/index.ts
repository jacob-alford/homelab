import { HttpApiGroup } from "@effect/platform"
import { Middleware } from "homelab-services"
import * as Health from "./health.js"
import * as Self from "./self.js"

export const StatusApi = HttpApiGroup.make("status")
  .add(Health.HealthEndpoint)
  .add(Self.SelfEndpoint)
  .prefix("/status")
  .middleware(Middleware.AuthMiddleware)

export * as Health from "./health.js"
export * as Self from "./self.js"
