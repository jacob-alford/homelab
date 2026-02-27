import { Effect } from "effect"
import { ApiErrors } from "homelab-api"

export const handleDeviceAcme = () =>
  Effect.fail(
    new ApiErrors.NotImplemented({
      message: "Endpoint device-acme not implemented",
      internalMethod: "handleDeviceAcme",
    }),
  )
