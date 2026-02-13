import type { Effect } from "effect"
import { Context, Data } from "effect"

import type { XML } from "homelab-api/schemas/XML"
import type { JSONExt } from "../../schemas/JSONExt.js"

export const XmlPrintingServiceId = "homelab-api/services/xml-printing-service/XmlPrintingService"

export class XmlPrintingError extends Data.TaggedError("XmlPrintingError")<{
  readonly error: unknown
}> {}

export interface XmlPrintingServiceImpl {
  printXml(json: Record<string, JSONExt>): Effect.Effect<XML, XmlPrintingError>
}

export class XmlPrintingService extends Context.Tag(XmlPrintingServiceId)<
  XmlPrintingService,
  XmlPrintingServiceImpl
>() {}
