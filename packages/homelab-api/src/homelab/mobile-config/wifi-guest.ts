import { HttpApiEndpoint } from "@effect/platform"
import { Schema } from "effect"

export const WifiGuest = HttpApiEndpoint.get("wifi-guest")`/wifi-guest`.addSuccess(Schema.String)
