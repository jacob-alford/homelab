import { Schema } from "effect"

export const XMLSymbol = Symbol.for("homelab/XML")

export const XMLSchema = Schema.String.pipe(
  Schema.brand(XMLSymbol),
  Schema.annotations({
    description: "An XML Document",
    title: "XML",
    examples: [
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
<plist version="1.0">
  <string>test</string>
</plist>` as any,
    ],
  }),
)

export type XML = typeof XMLSchema.Type
