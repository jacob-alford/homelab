import { Layer } from "effect"
import { Config, type Services } from "homelab-services"

export const ProfileUuidConfigLive = Layer.succeed(
  Config.ProfileUuidConfig.ProfileUuidConfig,
  {
    homelabPayloadWifiUuid(ssidName: string): Services.UuidService.UUID | null {
      switch (ssidName) {
        case "0x676179":
          return "30d28d43-2c8a-4e8e-83ee-6c355e089181" as Services.UuidService.UUID
        case "dialup-express":
          return "6d104c5a-a004-4c39-8fdc-d44b2e2675a9" as Services.UuidService.UUID
        default:
          return null
      }
    },
    homelabPayloadRootCertUuid: "29e643a9-3d13-4166-bf72-e1fd5ab7d092" as Services.UuidService.UUID,
    homelabPayloadIntermediateCertUuid: "35e92a54-ebd9-41a7-a4a5-1d33fd10b1af" as Services.UuidService.UUID,
    homelabPayloadAcmeUuid: "2f87bf76-cd13-40a0-a90e-d48d94c85a17" as Services.UuidService.UUID,

    homelabConfigAcmeUuid: "f250f388-a4df-4908-b343-c6965c8b9fca" as Services.UuidService.UUID,
    homelabConfigCertsUuid: "f033f4fe-6e41-46c8-8fe0-51447e2f3935" as Services.UuidService.UUID,
    homelabConfigWifiUuid: "d8ac9793-ebfd-458c-b4bc-30446dbad95e" as Services.UuidService.UUID,
    homelabConfigDnsUuid: "49bb172d-701b-4f0e-a56d-087970ece21f" as Services.UuidService.UUID,
    homelabPayloadEthernetUuid: "1674d657-58d2-4f31-83c4-abe0530f0fef" as Services.UuidService.UUID,
  },
)
