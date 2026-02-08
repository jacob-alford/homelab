import { NotImplemented } from "@effect/platform/HttpApiError"
import { Effect } from "effect"

export const handleDeviceAcme = () => Effect.fail(new NotImplemented())
