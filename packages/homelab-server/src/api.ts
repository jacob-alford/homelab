import { HttpApiBuilder } from "@effect/platform"
import { Layer } from "effect"
import { Homelab, Middleware, Services } from "homelab-api"
import { MobileConfigApiLive } from "./handlers/mobile-config/index.js"
import { OAuthApiLive } from "./handlers/oauth/index.js"
import { StatusApiLive } from "./handlers/status/index.js"
import { WellKnownApiLive } from "./handlers/well-known/index.js"

export const ApiLive = HttpApiBuilder.api(Homelab.HomelabApi).pipe(
  Layer.provide(MobileConfigApiLive),
  Layer.provide(OAuthApiLive),
  Layer.provide(StatusApiLive),
  Layer.provide(WellKnownApiLive),
  Layer.provide(Middleware.AuthMiddlewareLive),
  Layer.provide(Middleware.BasicAuthMiddlewareLive),
  Layer.provide(Services.TokenIssuerService.TokenIssuerServiceLive),
  Layer.provide(HttpApiBuilder.middlewareCors()),
)
