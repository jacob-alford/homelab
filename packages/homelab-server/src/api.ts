import { HttpApiBuilder } from "@effect/platform"
import { Layer } from "effect"
import { API } from "homelab-api"
import { MobileConfigApiLive } from "./handlers/mobile-config/index.js"

export const ApiLive = HttpApiBuilder.api(API.HomelabApi).pipe(
  Layer.provide(MobileConfigApiLive),
  Layer.provide(HttpApiBuilder.middlewareCors()),
)
