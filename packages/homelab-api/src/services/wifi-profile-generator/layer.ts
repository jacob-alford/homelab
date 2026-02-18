import { Effect, Layer } from "effect"

import { type WifiPayloadFull } from "homelab-api/schemas/wifi-payload-full"
import { CertPayloadService } from "../cert-payload-service/index.js"
import { CertificateService } from "../certificate-service/index.js"
import { UuidDictionaryService } from "../uuid-dictionary-service/index.js"
import { WifiPayloadService } from "../wifi-payload-service/definition.js"
import type { WifiProfileServiceDef } from "./definition.js"
import { WifiProfileService } from "./definition.js"

export const WifiProfileServiceLive = Layer.effect(
  WifiProfileService,
  Effect.gen(function*() {
    return new WifiProfileServiceImpl(
      yield* CertPayloadService,
      yield* CertificateService,
      yield* UuidDictionaryService,
      yield* WifiPayloadService,
    )
  }),
)

class WifiProfileServiceImpl implements WifiProfileServiceDef {
  constructor(
    private readonly certPayloadService: typeof CertPayloadService.Service,
    private readonly certs: typeof CertificateService.Service,
    private readonly uuids: typeof UuidDictionaryService.Service,
    private readonly wifiPayloadService: typeof WifiPayloadService.Service,
  ) {}

  wpa3EnterprisePeapWifi(...wifiParams: Parameters<typeof WifiPayloadService.Service.wpa3EnterprisePeapWifi>) {
    const certPayloadService = this.certPayloadService
    const certs = this.certs
    const uuids = this.uuids
    const wifiPayloadService = this.wifiPayloadService

    return Effect.gen(function*() {
      const rootCertPayload = yield* certPayloadService.cert(
        "roots.crt",
        certs.rootCert,
        "root",
      )

      const intermediatePayload = yield* certPayloadService.cert(
        "intermediates.crt",
        certs.intermediateCert,
        "intermediate",
      )

      const [ssid] = wifiParams

      const wifiPayload = yield* wifiPayloadService.wpa3EnterprisePeapWifi(...wifiParams)

      return {
        ConsentText: { default: `This allows iOS to connect automatically to the ${ssid} network` },
        PayloadContent: [
          rootCertPayload,
          intermediatePayload,
          wifiPayload,
        ],
        PayloadDescription: `This profile allows this device to connect to the ${ssid} network.`,
        PayloadDisplayName: `${ssid} Wi-Fi and Certificates`,
        PayloadIdentifier:
          `alford.plato-splunk.homelab.homelab-api.wifi-profile-generator.${uuids._0x676179WifiAndCertsPayloadUuid}`,
        PayloadOrganization: "Plato Splunk Media",
        PayloadRemovalDisallowed: false,
        PayloadType: "Configuration",
        PayloadUUID: uuids._0x676179WifiAndCertsPayloadUuid,
        PayloadVersion: 1,
      } satisfies WifiPayloadFull
    })
  }
}
