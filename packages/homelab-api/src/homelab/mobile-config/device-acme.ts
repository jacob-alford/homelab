import { HttpApiEndpoint } from "@effect/platform"
import { Schema } from "effect"

export const DeviceAcme = HttpApiEndpoint.get("device-acme")`/device-acme`.addSuccess(Schema.String)
