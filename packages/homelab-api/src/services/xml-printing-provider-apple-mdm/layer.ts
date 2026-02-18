import * as Str from "@effect/typeclass/data/String"
import * as Sg from "@effect/typeclass/Semigroup"
import { inspect } from "bun"
import type { Predicate } from "effect"
import { Array, Effect, flow, Layer, pipe, Record, String } from "effect"
import { Lines } from "homelab-data"
import type { JSONExt } from "../../schemas/index.js"
import { XML } from "../../schemas/index.js"
import { XmlPrintingError, XmlPrintingService } from "../xml-printing-service/index.js"
import { AppleMdmXmlPrintingConfig } from "./definition.js"

export const AppleMdmXmlPrintingConfigDefault = Layer.succeed(
  AppleMdmXmlPrintingConfig,
  {},
)

export const AppleMdmXmlPrintingLive = Layer.effect(
  XmlPrintingService,
  Effect.gen(function*() {
    const config = yield* AppleMdmXmlPrintingConfig

    return new AppleMdmXmlPrintingImpl(config)
  }),
)

class AppleMdmXmlPrintingImpl {
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

  printXml(json: JSONExt.JSONRecord): Effect.Effect<XML.XML, XmlPrintingError> {
    return pipe(
      this.encodeContent(json),
      Effect.map(
        (content) =>
          pipe(
            Lines.lines(
              ...this.xmlLeader,
              ...this.doctype,
              ...this.plist(content),
            ),
            Array.reduce(
              "",
              (z, [depth, line]) => z.concat(`${this.indent.repeat(depth)}${line}${this.newline}`),
            ),
          ),
      ),
      Effect.map(
        XML.wrapUnsafe,
      ),
    )
  }

  private get xmlLeader() {
    return this.$({
      node: "?xml",
      attributes: {
        version: "1.0",
        encoding: this.encoding,
      },
      closingCharacter: "?",
    })
  }

  private get doctype() {
    return this.$({
      node: "!DOCTYPE",
      attributes: {
        plist: null,
        PUBLIC: null,
        [`"-//Apple//DTD PLIST 1.0//EN"`]: null,
        [`"http://www.apple.com/DTDs/PropertyList-1.0.dtd"`]: null,
      },
      closingCharacter: null,
    })
  }

  private plist(plistContents: Lines.Lines) {
    return this.$({
      node: "plist",
      attributes: {
        version: "1.0",
      },
      children: plistContents,
      inlineChildren: false,
    })
  }

  private $(
    params: XmlTagTemplate,
  ): Lines.Lines {
    const {
      attributes = {},
      children,
      closingCharacter = "/",
      depth = 0,
      inlineChildren = true,
      node,
    } = params

    const attributesStr = pipe(
      attributes,
      Record.collect((k, v) => v ? `${k}="${this.escape(v)}"` : k),
      Array.join(" "),
      (_) => _ === "" ? "" : ` ${_}`,
    )

    if (!children) {
      return Lines.singleton(depth, `<${node}${attributesStr}${closingCharacter ?? ""}>`)
    }

    const nodeOpen = `<${node}${attributesStr}>`
    const nodeClose = `</${node}>`

    if (inlineChildren) {
      const [, child] = Lines.fstChild(children)

      return Lines.singleton(depth, `${nodeOpen}${child}${nodeClose}`)
    }

    return Lines.lines(
      Lines.line(
        depth,
        nodeOpen,
      ),
      ...children,
      Lines.line(
        depth,
        nodeClose,
      ),
    )
  }

  private escape(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")
  }

  private encodeContent(json: JSONExt.JSONExt, depth = 0): Effect.Effect<Lines.Lines, XmlPrintingError> {
    const depthLevel = depth

    if (json === null) {
      return Effect.fail(
        new XmlPrintingError({
          error: "Null values are not allowed",
        }),
      )
    }

    if (typeof json === "string") {
      return Effect.succeed(
        this.$({
          node: "string",
          children: Lines.singleton(depth, this.escape(json)),
          depth: depthLevel,
        }),
      )
    }

    if (typeof json === "number") {
      if (Number.isNaN(json) || !Number.isSafeInteger(json)) {
        return Effect.fail(
          new XmlPrintingError({
            error: `Receieved invalid number: ${json}`,
          }),
        )
      } else {
        return Effect.succeed(
          this.$({
            node: "integer",
            children: Lines.singleton(depth, `${json}`),
            depth,
          }),
        )
      }
    }

    if (typeof json === "boolean") {
      return Effect.succeed(
        this.$({
          node: `${json}`,
          depth,
        }),
      )
    }

    if (this.isBuffer(json)) {
      return Effect.try({
        try: () => {
          const dataString = pipe(
            json.toString("base64"),
            String.split(""),
            Array.chunksOf(52),
            Array.map(Array.join("")),
          )

          return this.$({
            node: "data",
            depth,
            children: Array.map(dataString, (dataLine) => Lines.line(depth, dataLine)),
            inlineChildren: false,
          })
        },
        catch(error) {
          return new XmlPrintingError({ error })
        },
      })
    }

    if (this.isObject(json)) {
      return Effect.reduce(
        Record.toEntries(json),
        Array.empty<Lines.Line>(),
        (z, [k, v]) =>
          this.encodeContent(v, depthLevel + 1).pipe(
            Effect.map(
              (children) =>
                z.concat(
                  this.$({
                    node: "key",
                    depth: depth + 1,
                    children: Lines.singleton(depth + 1, k),
                  }),
                  children,
                ),
            ),
          ),
      ).pipe(
        Effect.map(
          (content) =>
            this.$({
              node: "dict",
              depth,
              children: content,
              inlineChildren: false,
            }),
        ),
      )
    }

    if (this.isArray(json)) {
      return Effect.reduce(
        json,
        Lines.empty,
        (z, v) =>
          this.encodeContent(v, depthLevel + 1).pipe(
            Effect.map(
              (children) => z.concat(children),
            ),
          ),
      ).pipe(
        Effect.map(
          (content) =>
            this.$({
              node: "array",
              children: content,
              depth,
              inlineChildren: false,
            }),
        ),
      )
    }

    return Effect.die(
      new Error(`Unexpected type passed to AppleMdmXmlPrintingServiceImpl#printXml: ${inspect(json)}`),
    )
  }

  private isObject(json: JSONExt.JSONExt): json is JSONExt.JSONRecord {
    return json !== null && typeof json === "object" && !Array.isArray(json)
  }

  private isArray(json: JSONExt.JSONExt): json is JSONExt.JSONArray {
    return Array.isArray(json)
  }

  private isBuffer(json: JSONExt.JSONExt): json is Buffer {
    return json instanceof Buffer
  }
}

interface XmlTagTemplate {
  readonly node: string
  readonly attributes?: Record<string, string | null>
  readonly children?: Lines.Lines
  readonly depth?: number
  readonly inlineChildren?: boolean
  readonly closingCharacter?: string | null
}

function prepend(a: string): (b: string) => string {
  return function prependInner(b) {
    return `${a}${b}`
  }
}

function prependIf(pred: Predicate.Predicate<string>, prefix: string): (str: string) => string {
  return function prependIfInner(str) {
    if (pred(str)) return `${prefix}${str}`
    else return str
  }
}

const trimWhiteSpace: (str: string) => string = flow(
  String.trimStart,
  String.replace("\n", ""),
  String.trimStart,
)
