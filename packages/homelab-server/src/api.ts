import { HttpApiBuilder } from "@effect/platform"
import { Layer } from "effect"
import { Homelab } from "homelab-api"
import { MobileConfigApiLive } from "./handlers/mobile-config/index.js"

export const ApiLive = HttpApiBuilder.api(Homelab.HomelabApi).pipe(
  Layer.provide(MobileConfigApiLive),
  Layer.provide(HttpApiBuilder.middlewareCors()),
)
