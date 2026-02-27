import type { Effect } from "effect"
import { Context, Data } from "effect"

import type * as Schemas from "../../schemas/index.js"

export const WifiConfigServiceId = "homelab-api/services/wifi-config-service/WifiConfigService"

export class WifiConfigGenerationError extends Data.TaggedError("WifiConfigGenerationError")<{
  readonly error: string
  readonly reason: "ssid-not-found"
}> {}

export interface WifiConfigServiceDef {
  wpa3EnterprisePeapWifi(
    ssidString: string,
    username: string,
    password: string,
    disableMACRandomization?: boolean,
  ): Effect.Effect<Schemas.WifiConfig.WifiConfig, WifiConfigGenerationError>

  wpaPersonalWifi(
    wpaPersonalWifi: Schemas.WifiConfig.WifiEncryptionType,
    ssidString: string,
    password: string,
    disableMACRandomization?: boolean,
  ): Effect.Effect<Schemas.WifiConfig.WifiConfig, WifiConfigGenerationError>
}

export class WifiConfigService extends Context.Tag(WifiConfigServiceId)<WifiConfigService, WifiConfigServiceDef>() {
}
