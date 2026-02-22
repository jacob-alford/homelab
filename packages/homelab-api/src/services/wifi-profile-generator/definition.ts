import { Context, Effect } from "effect"

import type { Schemas } from "../../index.js"
import type { UuidGenerationError } from "../uuid-service/index.js"
import type { WifiPayloadService } from "../wifi-payload-service/definition.js"

export const WifiProfileServiceId = "homelab-api/services/wifi-profile-generator/WifiProfileGenerator"

export interface WifiProfileServiceDef {
  wpa3EnterprisePeapWifi(
    ...params: Parameters<typeof WifiPayloadService.Service.wpa3EnterprisePeapWifi>
  ): Effect.Effect<Schemas.WifiPayload.WifiPayloadFull, UuidGenerationError>
}

export class WifiProfileService extends Context.Tag(WifiProfileServiceId)<WifiProfileService, WifiProfileServiceDef>() {
}

export function wpa3EnterprisePeapWifi(
  ...args: Parameters<WifiProfileServiceDef["wpa3EnterprisePeapWifi"]>
): Effect.Effect<
  Schemas.WifiPayload.WifiPayloadFull,
  UuidGenerationError,
  WifiProfileService
> {
  return WifiProfileService.pipe(
    Effect.andThen(
      (_) => _.wpa3EnterprisePeapWifi(...args),
    ),
  )
}
