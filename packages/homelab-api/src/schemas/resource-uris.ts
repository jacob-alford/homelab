import { Schema } from "effect"
import type { ResourceURIs } from "../resource-uris.js"

export const ResourceURILiterals: ReadonlyArray<ResourceURIs> = [
  "Config.Wifi",
  "Config.ACME",
  "Config.Certs",
  "Status.Health",
]

export const ResourceURISchema = Schema.Literal(
  ...ResourceURILiterals,
)
