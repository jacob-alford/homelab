import { HttpApiEndpoint } from "@effect/platform"
import { NotImplemented } from "@effect/platform/HttpApiError"
import { Schema } from "effect"

export const DeviceAcme = HttpApiEndpoint.get("device-acme")`/device-acme`.addSuccess(Schema.String).addError(
  NotImplemented,
  {
    status: 501,
  },
)

export type DeviceAcmeEndpoint = typeof DeviceAcme
