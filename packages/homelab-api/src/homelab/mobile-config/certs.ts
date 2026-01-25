import { HttpApiEndpoint } from "@effect/platform"
import { Schema } from "effect"

export const Certs = HttpApiEndpoint.get("certs")`/certs`.addSuccess(Schema.String)
