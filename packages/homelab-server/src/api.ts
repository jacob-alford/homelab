import { HttpApiBuilder } from "@effect/platform"
import { Layer } from "effect"
import { Homelab } from "homelab-api"
import { Layers } from "homelab-services-node"
import { MobileConfigApiLive } from "./handlers/mobile-config/index.js"
import { OAuthApiLive } from "./handlers/oauth/index.js"
import { StatusApiLive } from "./handlers/status/index.js"
import { WellKnownApiLive } from "./handlers/well-known/index.js"
import { AuthMiddlewareLive, BasicAuthMiddlewareLive } from "./middleware/index.js"

export const ApiLive = HttpApiBuilder.api(Homelab.HomelabApi).pipe(
  Layer.provide(MobileConfigApiLive),
  Layer.provide(OAuthApiLive),
  Layer.provide(StatusApiLive),
  Layer.provide(WellKnownApiLive),
  Layer.provide(AuthMiddlewareLive),
  Layer.provide(BasicAuthMiddlewareLive),
  Layer.provide(Layers.TokenIssuerService.TokenIssuerServiceLive),
  Layer.provide(HttpApiBuilder.middlewareCors()),
)
