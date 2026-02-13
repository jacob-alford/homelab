import { HttpApiEndpoint } from "@effect/platform"
import { NotImplemented } from "@effect/platform/HttpApiError"
import { Schema } from "effect"

export const Certs = HttpApiEndpoint.get("certs")`/certs`.addSuccess(Schema.String).addError(
  NotImplemented,
  {
    status: 501,
  },
)

export type CertsEndpoint = typeof Certs
