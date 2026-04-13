import { HttpApiBuilder } from "@effect/platform"
import { Layer } from "effect"
import { Homelab, Middleware } from "homelab-api"
import { MobileConfigApiLive } from "./handlers/mobile-config/index.js"
import { StatusApiLive } from "./handlers/status/index.js"

export const ApiLive = HttpApiBuilder.api(Homelab.HomelabApi).pipe(
  Layer.provide(MobileConfigApiLive),
  Layer.provide(StatusApiLive),
  Layer.provide(Middleware.AuthMiddlewareLive),
  Layer.provide(HttpApiBuilder.middlewareCors()),
)
