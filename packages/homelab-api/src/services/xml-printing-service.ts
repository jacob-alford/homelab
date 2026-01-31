import type { Effect } from "effect"
import { Context, Data } from "effect"

import type { JSON } from "../schemas/JSON.js"

export const XmlPrintingServiceId = "homelab-api/services/xml-printing-service/XmlPrintingService"

export class XmlPrintingError extends Data.TaggedError("XmlPrintingError")<{}> { }

export interface XmlPrintingServiceImpl {
  printXml(json: Record<string, JSON>): Effect.Effect<string, XmlPrintingError>
}

export class XmlPrintingService extends Context.Tag(XmlPrintingServiceId)<
  XmlPrintingService,
  XmlPrintingServiceImpl
>() { }
