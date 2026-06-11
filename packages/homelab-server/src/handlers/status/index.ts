import { HttpApiBuilder } from "@effect/platform"
import { Homelab } from "homelab-api"

import { handleHealth } from "./health.js"
import { handleSelf } from "./self.js"

export const StatusApiLive = HttpApiBuilder.group(
  Homelab.HomelabApi,
  "status",
  (handlers) =>
    handlers
      .handle("health", handleHealth)
      .handle("self", handleSelf),
)
