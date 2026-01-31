import { Context, Effect, Layer } from "effect"
import { UuidService } from "./uuid-service.js"
import { XmlPrintingService } from "./xml-printing-service.js"

export const AppleMdmXmlPrintingConfigId = "AppleMdmXmlPrintingServiceConfig"

export class AppleMdmXmlPrintingConfig extends Context.Tag(AppleMdmXmlPrintingConfigId)<
  AppleMdmXmlPrintingConfig,
  {}
>() { }

export const AppleMdmXmlPrintingLive = Layer.effect(
  XmlPrintingService,
  Effect.gen(function*() {
    const config = yield* AppleMdmXmlPrintingConfig
    const UUID = yield* UuidService

    return {
      printXml(json) {
        // TODO
        return Effect.die(new Error("Not implemented"))
      },
    }
  }),
)
