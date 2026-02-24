import { Layer } from "effect"
import type { UUID } from "../uuid-service/index.js"
import { UuidDictionaryService } from "./definition.js"

export const UuidDictionaryServiceLive = Layer.succeed(
  UuidDictionaryService,
  {
    wifiPayloadUUID(ssidName) {
      switch (ssidName) {
        case "0x676179":
          return "30d28d43-2c8a-4e8e-83ee-6c355e089181" as UUID
        default:
          return null
      }
    },

    rootCertPayloadUuid: "29e643a9-3d13-4166-bf72-e1fd5ab7d092" as UUID,
    intermediateCertPayloadUuid: "35e92a54-ebd9-41a7-a4a5-1d33fd10b1af" as UUID,
    platoSplunkAcmePayloadUuid: "f250f388-a4df-4908-b343-c6965c8b9fca" as UUID,
    homelabConfigUuid: "d8ac9793-ebfd-458c-b4bc-30446dbad95e" as UUID,
  },
)
