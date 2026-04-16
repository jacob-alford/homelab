import { HttpApiBuilder } from "@effect/platform"
import { Homelab } from "homelab-api"

import { handleToken } from "./token.js"

export const OAuthApiLive = HttpApiBuilder.group(
  Homelab.HomelabApi,
  "oauth",
  (handlers) =>
    handlers
      .handle("token", handleToken),
)
