import {} from "@effect/typeclass"
import * as Str from "@effect/typeclass/data/String"
import * as Sg from "@effect/typeclass/Semigroup"
import { inspect } from "bun"
import { Array, Context, Effect, Layer, pipe, Record, String } from "effect"
import type { JSONArray, JSONExt, JSONRecord } from "../schemas/JSONExt.js"
import type { XmlPrintingServiceImpl } from "./xml-printing-service.js"
import { XmlPrintingError, XmlPrintingService } from "./xml-printing-service.js"

export const AppleMdmXmlPrintingConfigId = "AppleMdmXmlPrintingServiceConfig"

export class AppleMdmXmlPrintingConfig extends Context.Tag(AppleMdmXmlPrintingConfigId)<
  AppleMdmXmlPrintingConfig,
  {
    encoding?: string
    newline?: string
    indent?: string
  }
>() {}

export const AppleMdmXmlPrintingLive = Layer.effect(
  XmlPrintingService,
  Effect.gen(function*() {
    const config = yield* AppleMdmXmlPrintingConfig

    return new AppleMdmXmlPrintingImpl(config)
  }),
)

class AppleMdmXmlPrintingImpl implements XmlPrintingServiceImpl {
  private encoding: string
  private newline: string
  private indent: string

  constructor(
    {
      encoding = "UTF-8",
      indent = "  ",
      newline = "\n",
    }: typeof AppleMdmXmlPrintingConfig.Service,
  ) {
    this.encoding = encoding
    this.newline = newline
    this.indent = indent
  }

  printXml(json: JSONRecord): Effect.Effect<string, XmlPrintingError> {
    return pipe(
      this.encodeContent(json),
      Effect.map(
        (content) =>
          Sg.intercalate(this.newline)(Str.Semigroup).combineMany(
            this.xmlLeader,
            [
              this.doctype,
              this.b`${"plist"}${{ version: "1.0" }}${content}${0}${true}`,
            ],
          ),
      ),
      Effect.map(
        (result) => result.replaceAll("\n", this.newline),
      ),
    )
  }

  private get xmlLeader() {
    return `<?xml version="1.0" encoding="${this.encoding}"?>`
  }

  private get doctype() {
    return `<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">`
  }

  private b(
    [s]: TemplateStringsArray,
    node: string,
    attributes: Record<string, string> = {},
    content: string,
    indent: number = 0,
    multiline: boolean = false,
  ): string {
    const attributesStr = pipe(
      attributes,
      Record.collect((k, v) => `${k}="${this.escape(v)}"`),
      Array.join(" "),
    )

    const indentation = this.indent.repeat(indent)

    return `${s !== node ? s : ""}${indentation}<${node}${attributesStr === "" ? "" : ` ${attributesStr}`}>${content}${
      multiline ? `\n${indentation}` : ""
    }</${node}>`
  }

  private escape(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")
  }

  private encodeContent(json: JSONExt, depthLevel = 0): Effect.Effect<string, XmlPrintingError> {
    if (json === null) {
      return Effect.fail(
        new XmlPrintingError({
          error: "Null values are not allowed",
        }),
      )
    }

    if (typeof json === "string") {
      return Effect.succeed(this.b`\n${"string"}${{}}${this.escape(json)}${depthLevel}`)
    }

    if (typeof json === "number") {
      if (Number.isNaN(json) || !Number.isSafeInteger(json)) {
        return Effect.fail(
          new XmlPrintingError({
            error: `Receieved invalid number: ${json}`,
          }),
        )
      } else {
        return Effect.succeed(this.b`\n${"integer"}${{}}${inspect(json)}${depthLevel}`)
      }
    }

    if (typeof json === "boolean") {
      return Effect.succeed(`\n${this.indent.repeat(depthLevel)}<${json}/>`)
    }

    if (this.isBuffer(json)) {
      return Effect.try({
        try: () => {
          const dataString = pipe(
            json.toString("base64"),
            String.split(""),
            Array.chunksOf(52),
            Array.map(Array.join("")),
            Array.join("\n"),
          )

          return this.b`\n${"data"}${{}}${`\n${this.indent.repeat(depthLevel)}${dataString}`}${depthLevel}${true}`
        },
        catch(error) {
          return new XmlPrintingError({ error })
        },
      })
    }

    if (this.isObject(json)) {
      return Effect.reduce(
        Record.toEntries(json),
        "",
        (z, [k, v]) =>
          this.encodeContent(v, depthLevel + 1).pipe(
            Effect.map(
              (children) =>
                z +
                this.b`\n${"dict"}${{}}${this.b`\n${"key"}${{}}${k}${depthLevel + 1}` + children}${depthLevel}${true}`,
            ),
          ),
      )
    }

    if (this.isArray(json)) {
      return Effect.reduce(
        json,
        "",
        (z, v) =>
          this.encodeContent(v, depthLevel + 1).pipe(
            Effect.map(
              (children) => z + this.b`\n${"array"}${{}}${children}${depthLevel}${true}`,
            ),
          ),
      )
    }

    return Effect.die(
      new Error(`Unexpected type passed to AppleMdmXmlPrintingServiceImpl#printXml: ${inspect(json)}`),
    )
  }

  private isObject(json: JSONExt): json is JSONRecord {
    return json !== null && typeof json === "object" && !Array.isArray(json)
  }

  private isArray(json: JSONExt): json is JSONArray {
    return Array.isArray(json)
  }

  private isBuffer(json: JSONExt): json is Buffer {
    return json instanceof Buffer
  }
}
