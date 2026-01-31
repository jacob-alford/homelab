import { ParseResult, Schema } from "effect"

import type { JSON } from "./JSON.js"
import { JSONObjectSchema } from "./JSON.js"

export interface XMLEncodeOptions {
  rootElement: string
  rootAttributes?: Record<string, string>
  includeXmlDeclaration?: boolean
  encoding?: string
  doctype?: {
    name: string
    publicId?: string
    systemId?: string
  }
}

function escapeXML(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function encodeValue(value: JSON, indent: string, level: number): string {
  if (value === null) {
    return ""
  }

  if (typeof value === "string") {
    return escapeXML(value)
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }

  if (Array.isArray(value)) {
    return value.map((item) => encodeValue(item, indent, level)).join("")
  }

  if (typeof value === "object") {
    return encodeObject(value as Record<string, JSON>, indent, level)
  }

  return ""
}

function encodeObject(obj: Record<string, JSON>, indent: string, level: number): string {
  const newline = indent ? "\n" : ""
  const currentIndent = indent ? indent.repeat(level) : ""
  const nextIndent = indent ? indent.repeat(level + 1) : ""

  return Object.entries(obj)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value
          .map((item) => {
            if (typeof item === "object" && item !== null && !Array.isArray(item)) {
              const content = encodeObject(item as Record<string, JSON>, indent, level + 1)
              return `${newline}${currentIndent}<${key}>${content}${newline}${currentIndent}</${key}>`
            } else {
              const content = encodeValue(item, indent, level + 1)
              return `${newline}${currentIndent}<${key}>${content}</${key}>`
            }
          })
          .join("")
      } else if (typeof value === "object" && value !== null) {
        const content = encodeObject(value as Record<string, JSON>, indent, level + 1)
        return `${newline}${currentIndent}<${key}>${content}${newline}${currentIndent}</${key}>`
      } else {
        const content = encodeValue(value, indent, level + 1)
        if (content === "") {
          return `${newline}${currentIndent}<${key}/>`
        }
        return `${newline}${currentIndent}<${key}>${content}</${key}>`
      }
    })
    .join("")
}

export function encodeJSONToXML(
  json: Record<string, JSON>,
  options: XMLEncodeOptions,
  indent: string = "  ",
): string {
  const parts: Array<string> = []

  if (options.includeXmlDeclaration !== false) {
    const encoding = options.encoding || "utf-8"
    parts.push(`<?xml version="1.0" encoding="${encoding}"?>`)
  }

  if (options.doctype) {
    let doctype = `<!DOCTYPE ${options.doctype.name}`
    if (options.doctype.publicId && options.doctype.systemId) {
      doctype += ` PUBLIC "${options.doctype.publicId}" "${options.doctype.systemId}"`
    } else if (options.doctype.systemId) {
      doctype += ` SYSTEM "${options.doctype.systemId}"`
    }
    doctype += ">"
    parts.push(doctype)
  }

  const attributes = options.rootAttributes
    ? " " +
    Object.entries(options.rootAttributes)
      .map(([key, value]) => `${key}="${escapeXML(value)}"`)
      .join(" ")
    : ""

  const content = encodeObject(json, indent, 1)
  const newline = indent ? "\n" : ""

  parts.push(`<${options.rootElement}${attributes}>${content}${newline}</${options.rootElement}>`)

  return parts.join("\n")
}

export const XMLFromJSONSchema = Schema.transformOrFail(
  Schema.brand("XMLSchema")(Schema.String),
  JSONObjectSchema,
  {
    strict: true,
    decode(input, _options, ast) {
      return ParseResult.fail(new ParseResult.Forbidden(ast, input, "Decode not implemented"))
    },
    encode(output, _options, ast) {
      return ParseResult.fail(
        new ParseResult.Forbidden(
          ast,
          output,
          "Encode requires options. Use encodeJSONToXML function directly.",
        ),
      )
    },
  },
)
