import { HttpApiBuilder } from "@effect/platform"
import { Homelab } from "homelab-api"

import { handleOAuthAuthorizationWellKnown } from "./oauth-authorization-server.js"

export const WellKnownApiLive = HttpApiBuilder.group(
  Homelab.HomelabApi,
  "well-known",
  (handlers) =>
    handlers
      .handle("well-known-oauth-authorization", handleOAuthAuthorizationWellKnown),
)
