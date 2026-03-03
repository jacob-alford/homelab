import { HttpApiGroup } from "@effect/platform"
import * as Health from "./health.js"

export const StatusApi = HttpApiGroup.make("status")
  .add(Health.HealthEndpoint)
  .prefix("/status")

export * as Health from "./health.js"
