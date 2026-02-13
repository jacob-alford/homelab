import { Effect, Layer } from "effect"

import type { WifiConfig } from "homelab-api/schemas/index"
import { UuidDictionaryService } from "../uuid-dictionary-service/index.js"
import type { UuidGenerationError } from "../uuid-service/index.js"
import type { WifiPayloadServiceDef } from "./definition.js"
import { WifiPayloadService } from "./definition.js"

export const WifiPayloadServiceLive = Layer.effect(
  WifiPayloadService,
  Effect.gen(function*() {
    return new WifiPayloadServiceImpl(
      yield* UuidDictionaryService,
    )
  }),
)

class WifiPayloadServiceImpl implements WifiPayloadServiceDef {
  constructor(
    private readonly uuids: typeof UuidDictionaryService.Service,
  ) {}

  wpa3EnterprisePeapWifi(
    ssidString: string,
    username: string,
    password: string,
    disableMACRandomization: boolean = false,
  ): Effect.Effect<WifiConfig.WifiConfig, UuidGenerationError> {
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
        PayloadIdentifier: `com.apple.wifi.managed.${this.uuids._0x676179WifiPayloadUuid}`,
        PayloadType: `com.apple.wifi.managed`,
        PayloadUUID: this.uuids._0x676179WifiPayloadUuid,
        PayloadVersion: 1,
      } satisfies WifiConfig.WifiConfig,
    )
  }
}
