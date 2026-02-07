import { describe, expect, it } from "@effect/vitest"
import { Arbitrary, Console, Effect, FastCheck, Layer, Schema } from "effect"
import { constFalse, constTrue, flow, pipe } from "effect/Function"
import { XMLParser } from "fast-xml-parser"
import { AcmePayloadFull } from "../src/schemas/acme-payload-full.js"
import { WifiPayloadFullSchema } from "../src/schemas/wifi-payload-full.js"
import { AppleMdmXmlPrintingConfig, AppleMdmXmlPrintingLive } from "../src/services/xml-printing-provider-apple-mdm.js"
import { XmlPrintingError, XmlPrintingService } from "../src/services/xml-printing-service.js"

const DefaultConfig = Layer.succeed(AppleMdmXmlPrintingConfig, {
  encoding: "UTF-8",
  newline: "\n",
  indent: "  ",
})

const TestLayer = AppleMdmXmlPrintingLive.pipe(Layer.provide(DefaultConfig))

describe("AppleMdmXmlPrintingService", () => {
  describe("printXml", () => {
    it.effect("should encode string values", () =>
      Effect.gen(function*() {
        const service = yield* XmlPrintingService
        const result = yield* service.printXml({ name: "test" })

        expect(result).toContain("<?xml version=\"1.0\" encoding=\"UTF-8\"?>")
        expect(result).toContain("<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\"")
        expect(result).toContain("<plist version=\"1.0\">")
        expect(result).toContain("<string>test</string>")
        expect(result).toContain("</plist>")
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should encode integer values", () =>
      Effect.gen(function*() {
        const service = yield* XmlPrintingService
        const result = yield* service.printXml({ count: 42 })

        expect(result).toContain("<integer>42</integer>")
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should encode boolean true", () =>
      Effect.gen(function*() {
        const service = yield* XmlPrintingService
        const result = yield* service.printXml({ enabled: true })

        expect(result).toContain("<true/>")
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should encode boolean false", () =>
      Effect.gen(function*() {
        const service = yield* XmlPrintingService
        const result = yield* service.printXml({ enabled: false })

        expect(result).toContain("<false/>")
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should escape special characters in strings", () =>
      Effect.gen(function*() {
        const service = yield* XmlPrintingService
        const result = yield* service.printXml({ text: "<tag attr=\"value\">&test" })

        expect(result).toContain("&lt;tag attr=&quot;value&quot;&gt;&amp;test")
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should encode nested objects", () =>
      Effect.gen(function*() {
        const service = yield* XmlPrintingService
        const result = yield* service.printXml({
          user: {
            name: "John",
            age: 30,
          },
        })

        expect(result).toContain("<dict>")
        expect(result).toContain("<key>name</key>")
        expect(result).toContain("<string>John</string>")
        expect(result).toContain("<key>age</key>")
        expect(result).toContain("<integer>30</integer>")
        expect(result).toContain("</dict>")
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should encode arrays", () =>
      Effect.gen(function*() {
        const service = yield* XmlPrintingService
        const result = yield* service.printXml({
          items: ["apple", "banana", "cherry"],
        })

        expect(result).toContain("<array>")
        expect(result).toContain("<string>apple</string>")
        expect(result).toContain("<string>banana</string>")
        expect(result).toContain("<string>cherry</string>")
        expect(result).toContain("</array>")
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should encode Buffer as base64 data", () =>
      Effect.gen(function*() {
        const service = yield* XmlPrintingService
        const buffer = Buffer.from("Hello, World!")
        const result = yield* service.printXml({ payload: buffer })

        expect(result).toContain("<data>")
        expect(result).toContain("SGVsbG8sIFdvcmxkIQ==")
        expect(result).toContain("</data>")
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should encode complex nested structures", () =>
      Effect.gen(function*() {
        const service = yield* XmlPrintingService
        const result = yield* service.printXml({
          config: {
            enabled: true,
            servers: ["server1", "server2"],
            timeout: 30,
          },
        })

        expect(result).toContain("<dict>")
        expect(result).toContain("<key>enabled</key>")
        expect(result).toContain("<true/>")
        expect(result).toContain("<key>servers</key>")
        expect(result).toContain("<array>")
        expect(result).toContain("<string>server1</string>")
        expect(result).toContain("<key>timeout</key>")
        expect(result).toContain("<integer>30</integer>")
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should fail on null values", () =>
      Effect.gen(function*() {
        const service = yield* XmlPrintingService
        const result = yield* Effect.flip(service.printXml({ value: null }))

        expect(result).toBeInstanceOf(XmlPrintingError)
        expect(result.error).toBe("Null values are not allowed")
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should fail on NaN values", () =>
      Effect.gen(function*() {
        const service = yield* XmlPrintingService
        const result = yield* Effect.flip(service.printXml({ value: NaN }))

        expect(result).toBeInstanceOf(XmlPrintingError)
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should fail on unsafe integers", () =>
      Effect.gen(function*() {
        const service = yield* XmlPrintingService
        const result = yield* Effect.flip(service.printXml({ value: Number.MAX_SAFE_INTEGER + 1 }))

        expect(result).toBeInstanceOf(XmlPrintingError)
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should respect custom encoding configuration", () =>
      Effect.gen(function*() {
        const service = yield* XmlPrintingService
        const result = yield* service.printXml({ test: "value" })

        expect(result).toContain("<?xml version=\"1.0\" encoding=\"ISO-8859-1\"?>")
      }).pipe(
        Effect.provide(
          AppleMdmXmlPrintingLive.pipe(
            Layer.provide(
              Layer.succeed(AppleMdmXmlPrintingConfig, {
                encoding: "ISO-8859-1",
                newline: "\n",
                indent: "  ",
              }),
            ),
          ),
        ),
      ))

    it.effect("should respect custom indent configuration", () =>
      Effect.gen(function*() {
        const service = yield* XmlPrintingService
        const result = yield* service.printXml({ obj: { key: "value" } })

        expect(result).toContain("    <key>key</key>")
      }).pipe(
        Effect.provide(
          AppleMdmXmlPrintingLive.pipe(
            Layer.provide(
              Layer.succeed(AppleMdmXmlPrintingConfig, {
                encoding: "UTF-8",
                newline: "\n",
                indent: "    ",
              }),
            ),
          ),
        ),
      ))

    it.effect("should generate valid XML for any WifiPayloadFull schema instance", () =>
      Effect.gen(function*() {
        const service = yield* XmlPrintingService
        const arbitrary = Arbitrary.make(WifiPayloadFullSchema)
        const xmlParser = new XMLParser()

        yield* Effect.try(
          () =>
            FastCheck.assert(
              FastCheck.asyncProperty(
                arbitrary,
                (payload) =>
                  service.printXml(payload).pipe(
                    Effect.tap(
                      (xmlPayload) => Effect.try(() => xmlParser.parse(xmlPayload)),
                    ),
                    Effect.tap(Console.log),
                    Effect.tapError(Console.error),
                    Effect.mapBoth(
                      {
                        onFailure: constFalse,
                        onSuccess: constTrue,
                      },
                    ),
                    Effect.runPromise,
                  ),
              ),
            ),
        )
      }).pipe(Effect.provide(TestLayer)))
    it.effect("should generate valid XML for any AcmePayloadFull schema instance", () =>
      Effect.gen(function*() {
        const service = yield* XmlPrintingService
        const arbitrary = Arbitrary.make(AcmePayloadFull)
        const xmlParser = new XMLParser()

        yield* Effect.try(
          () =>
            FastCheck.assert(
              FastCheck.asyncProperty(
                arbitrary,
                (_) =>
                  pipe(
                    _,
                    Schema.encode(AcmePayloadFull),
                    Effect.flatMap(
                      (payload) =>
                        service.printXml(payload).pipe(
                          Effect.tap(
                            (xmlPayload) => Effect.try(() => xmlParser.parse(xmlPayload)),
                          ),
                          Effect.tapError(Console.error),
                          Effect.mapBoth(
                            {
                              onFailure: constFalse,
                              onSuccess: constTrue,
                            },
                          ),
                        ),
                    ),
                    Effect.runPromise,
                  ),
              ),
            ),
        )
      }).pipe(Effect.provide(TestLayer)))
  })
})
