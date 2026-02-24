import type { Effect } from "effect"
import { Context, Data } from "effect"

import type * as Schemas from "../../schemas/index.js"

export const WifiPayloadServiceId = "homelab-api/services/wifi-payload-service/WifiPayloadService"

export class WifiPayloadGenerationError extends Data.TaggedError("WifiPayloadGenerationError")<{
  readonly error: string
  readonly reason: "ssid-not-found"
}> {}

export interface WifiPayloadServiceDef {
  wpa3EnterprisePeapWifi(
    ssidString: string,
    username: string,
    password: string,
    disableMACRandomization?: boolean,
  ): Effect.Effect<Schemas.WifiConfig.WifiConfig, WifiPayloadGenerationError>

  wpaPersonalWifi(
    wpaPersonalWifi: Schemas.WifiConfig.WifiEncryptionType,
    ssidString: string,
    password: string,
    disableMACRandomization?: boolean,
  ): Effect.Effect<Schemas.WifiConfig.WifiConfig, WifiPayloadGenerationError>
}

export class WifiPayloadService extends Context.Tag(WifiPayloadServiceId)<WifiPayloadService, WifiPayloadServiceDef>() {
}
