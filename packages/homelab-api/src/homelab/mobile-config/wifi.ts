import { HttpApiEndpoint } from "@effect/platform"
import { Schema } from "effect"

export const Wifi = HttpApiEndpoint.get("wifi")`/wifi`.addSuccess(Schema.String)
