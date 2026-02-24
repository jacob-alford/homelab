import { Context, Effect } from "effect"

import type * as Schemas from "../../schemas/index.js"
import type { WifiPayloadGenerationError, WifiPayloadService } from "../wifi-payload-service/definition.js"

export const WifiProfileServiceId = "homelab-api/services/wifi-profile-generator/WifiProfileGenerator"

export interface WifiProfileServiceDef {
  wpaPersonalWifi(
    ...params: Parameters<typeof WifiPayloadService.Service.wpaPersonalWifi>
  ): Effect.Effect<Schemas.WifiPayload.WifiPayloadFull, WifiPayloadGenerationError>

  wpa3EnterprisePeapWifi(
    ...params: Parameters<typeof WifiPayloadService.Service.wpa3EnterprisePeapWifi>
  ): Effect.Effect<Schemas.WifiPayload.WifiPayloadFull, WifiPayloadGenerationError>
}

export class WifiProfileService extends Context.Tag(WifiProfileServiceId)<WifiProfileService, WifiProfileServiceDef>() {
}

export function wpaPersonalWifi(
  ...args: Parameters<WifiProfileServiceDef["wpaPersonalWifi"]>
): Effect.Effect<
  Schemas.WifiPayload.WifiPayloadFull,
  WifiPayloadGenerationError,
  WifiProfileService
> {
  return WifiProfileService.pipe(
    Effect.andThen(
      (_) => _.wpaPersonalWifi(...args),
    ),
  )
}

export function wpa3EnterprisePeapWifi(
  ...args: Parameters<WifiProfileServiceDef["wpa3EnterprisePeapWifi"]>
): Effect.Effect<
  Schemas.WifiPayload.WifiPayloadFull,
  WifiPayloadGenerationError,
  WifiProfileService
> {
  return WifiProfileService.pipe(
    Effect.andThen(
      (_) => _.wpa3EnterprisePeapWifi(...args),
    ),
  )
}
