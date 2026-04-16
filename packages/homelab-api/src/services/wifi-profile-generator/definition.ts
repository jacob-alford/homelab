import { Context, Effect } from "effect"

import type * as ApiErrors from "../../errors/http-errors.js"
import type * as Schemas from "../../schemas/index.js"
import type { WifiConfigGenerationError, WifiConfigService } from "../wifi-config-service/definition.js"

export const WifiProfileServiceId = "homelab-api/services/wifi-profile-generator/WifiProfileGenerator"

export interface WifiProfileServiceDef {
  /** Generates a complete MDM root profile containing a WPA personal Wi-Fi configuration. */
  wpaPersonalWifi(
    ...params: Parameters<typeof WifiConfigService.Service.wpaPersonalWifi>
  ): Effect.Effect<Schemas.RootPayload.RootPayloadWire, WifiConfigGenerationError | ApiErrors.HttpApiEncodeError>

  /** Generates a complete MDM root profile containing a WPA3-Enterprise PEAP Wi-Fi configuration. */
  wpa3EnterprisePeapWifi(
    ...params: Parameters<typeof WifiConfigService.Service.wpa3EnterprisePeapWifi>
  ): Effect.Effect<Schemas.RootPayload.RootPayloadWire, WifiConfigGenerationError | ApiErrors.HttpApiEncodeError>
}

export class WifiProfileService extends Context.Tag(WifiProfileServiceId)<WifiProfileService, WifiProfileServiceDef>() {
}

/** {@inheritDoc WifiProfileServiceDef.wpaPersonalWifi} */
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

/** {@inheritDoc WifiProfileServiceDef.wpa3EnterprisePeapWifi} */
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
