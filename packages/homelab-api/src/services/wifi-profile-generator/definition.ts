import type { Effect } from "effect"
import { Context } from "effect"

import { type WifiPayloadFull } from "homelab-api/schemas/wifi-payload-full"
import type { UuidGenerationError } from "../uuid-service/index.js"
import type { WifiPayloadService } from "../wifi-payload-service/definition.js"

export const WifiProfileServiceId = "homelab-api/services/wifi-profile-generator/WifiProfileGenerator"

export interface WifiProfileServiceDef {
  wpa3EnterprisePeapWifi(
    ...params: Parameters<typeof WifiPayloadService.Service.wpa3EnterprisePeapWifi>
  ): Effect.Effect<WifiPayloadFull, UuidGenerationError>
}

export class WifiProfileService extends Context.Tag(WifiProfileServiceId)<WifiProfileService, WifiProfileServiceDef>() {
}
