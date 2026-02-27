import { Context, Effect } from "effect"

import type { ApiErrors } from "../../index.js"
import type * as Schemas from "../../schemas/index.js"
import type { WifiConfigGenerationError, WifiConfigService } from "../wifi-config-service/definition.js"

export const WifiProfileServiceId = "homelab-api/services/wifi-profile-generator/WifiProfileGenerator"

export interface WifiProfileServiceDef {
  wpaPersonalWifi(
    ...params: Parameters<typeof WifiConfigService.Service.wpaPersonalWifi>
  ): Effect.Effect<Schemas.RootPayload.RootPayloadWire, WifiConfigGenerationError | ApiErrors.HttpApiEncodeError>

  wpa3EnterprisePeapWifi(
    ...params: Parameters<typeof WifiConfigService.Service.wpa3EnterprisePeapWifi>
  ): Effect.Effect<Schemas.RootPayload.RootPayloadWire, WifiConfigGenerationError | ApiErrors.HttpApiEncodeError>
}

export class WifiProfileService extends Context.Tag(WifiProfileServiceId)<WifiProfileService, WifiProfileServiceDef>() {
}

export function wpaPersonalWifi(
  ...args: Parameters<WifiProfileServiceDef["wpaPersonalWifi"]>
): Effect.Effect<
  Schemas.RootPayload.RootPayloadWire,
  WifiConfigGenerationError | ApiErrors.HttpApiEncodeError,
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
  Schemas.RootPayload.RootPayloadWire,
  WifiConfigGenerationError | ApiErrors.HttpApiEncodeError,
  WifiProfileService
> {
  return WifiProfileService.pipe(
    Effect.andThen(
      (_) => _.wpa3EnterprisePeapWifi(...args),
    ),
  )
}
