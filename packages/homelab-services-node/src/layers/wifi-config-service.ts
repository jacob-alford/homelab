import { Effect, Layer } from "effect"
import type { Schemas } from "homelab-services"
import { Config, Services } from "homelab-services"

export const WifiConfigServiceLive = Layer.effect(
  Services.WifiConfigService.WifiConfigService,
  Effect.gen(function*() {
    return new WifiConfigServiceImpl(
      yield* Config.ProfileUuidConfig.ProfileUuidConfig,
    )
  }),
)

class WifiConfigServiceImpl implements Services.WifiConfigService.WifiConfigServiceDef {
  constructor(
    private readonly uuids: typeof Config.ProfileUuidConfig.ProfileUuidConfig.Service,
  ) {}

  wpaPersonalWifi(
    encryptionType: Schemas.WifiConfig.WifiEncryptionType,
    ssidString: string,
    password: string,
    disableMACRandomization: boolean = false,
  ): Effect.Effect<Schemas.WifiConfig.WifiConfig, Services.WifiConfigService.WifiConfigGenerationError> {
    const payloadUuid = this.uuids.wifiPayloadUUID(ssidString)

    if (!payloadUuid) {
      return Effect.fail(
        new Services.WifiConfigService.WifiConfigGenerationError({
          error: `SSID ${ssidString} not found`,
          reason: "ssid-not-found",
        }),
      )
    }

    return Effect.succeed(
      {
        AutoJoin: true,
        CaptiveBypass: false,
        DisableAssociationMACRandomization: disableMACRandomization,
        EncryptionType: encryptionType,
        HIDDEN_NETWORK: false,
        IsHotspot: false,
        ProxyType: "None",
        SSID_STR: ssidString,
        PayloadDescription: "Configures Wi-Fi settings",
        PayloadDisplayName: "Wi-Fi",
        PayloadIdentifier: `com.apple.wifi.managed.${payloadUuid}`,
        PayloadType: `com.apple.wifi.managed`,
        PayloadUUID: payloadUuid,
        PayloadVersion: 1,
        Password: password,
      } satisfies Schemas.WifiConfig.WifiConfig,
    )
  }

  wpa3EnterprisePeapWifi(
    ssidString: string,
    username: string,
    password: string,
    disableMACRandomization: boolean = false,
  ): Effect.Effect<Schemas.WifiConfig.WifiConfig, Services.WifiConfigService.WifiConfigGenerationError> {
    const payloadUuid = this.uuids.wifiPayloadUUID(ssidString)

    if (!payloadUuid) {
      return Effect.fail(
        new Services.WifiConfigService.WifiConfigGenerationError({
          error: `SSID ${ssidString} not found`,
          reason: "ssid-not-found",
        }),
      )
    }

    return Effect.succeed(
      {
        AutoJoin: true,
        CaptiveBypass: false,
        DisableAssociationMACRandomization: disableMACRandomization,
        EAPClientConfiguration: {
          AcceptEAPTypes: [25],
          PayloadCertificateAnchorUUID: [
            this.uuids.rootCertPayloadUuid,
            this.uuids.intermediateCertPayloadUuid,
          ],
          TLSMaximumVersion: "1.3",
          TLSMinimumVersion: "1.2",
          TLSTrustedServerNames: ["radius.plato-splunk.media"],
          UserName: username,
          UserPassword: password,
        },
        EncryptionType: "WPA3",
        HIDDEN_NETWORK: false,
        IsHotspot: false,
        ProxyType: "None",
        SSID_STR: ssidString,

        PayloadDescription: "Configures Wi-Fi settings",
        PayloadDisplayName: "Wi-Fi",
        PayloadIdentifier: `com.apple.wifi.managed.${payloadUuid}`,
        PayloadType: `com.apple.wifi.managed`,
        PayloadUUID: payloadUuid,
        PayloadVersion: 1,
      } satisfies Schemas.WifiConfig.WifiConfig,
    )
  }
}
