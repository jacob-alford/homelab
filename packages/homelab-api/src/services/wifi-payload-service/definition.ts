import type { Effect } from "effect"
import { Context } from "effect"

import { Schemas } from "../../index.js"
import type { UuidGenerationError } from "../uuid-service/index.js"

export const WifiPayloadServiceId = "homelab-api/services/wifi-payload-service/WifiPayloadService"

export interface WifiPayloadServiceDef {
  wpa3EnterprisePeapWifi(
    ssidString: string,
    username: string,
    password: string,
    disableMACRandomization?: boolean,
  ): Effect.Effect<Schemas.WifiConfig.WifiConfig, UuidGenerationError>
}

export class WifiPayloadService extends Context.Tag(WifiPayloadServiceId)<WifiPayloadService, WifiPayloadServiceDef>() {
}
