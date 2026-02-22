import { Context, Data, Effect } from "effect"

import type { Schemas } from "../../index.js"

export const XmlPrintingServiceId = "homelab-api/services/xml-printing-service/XmlPrintingService"

export class XmlPrintingError extends Data.TaggedError("XmlPrintingError")<{
  readonly error: unknown
}> {}

export interface XmlPrintingServiceImpl {
  printXml(json: Record<string, Schemas.JSONExt.JSONExt>): Effect.Effect<Schemas.XML.XML, XmlPrintingError>
}

export class XmlPrintingService extends Context.Tag(XmlPrintingServiceId)<
  XmlPrintingService,
  XmlPrintingServiceImpl
>() {}

export function printXml(
  ...args: Parameters<XmlPrintingServiceImpl["printXml"]>
): Effect.Effect<Schemas.XML.XML, XmlPrintingError, XmlPrintingService> {
  return XmlPrintingService.pipe(
    Effect.andThen(
      (_) => _.printXml(...args),
    ),
  )
}
