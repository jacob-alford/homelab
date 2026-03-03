import { HttpApi } from "@effect/platform"
import { MobileConfigApi } from "./mobile-config/index.js"
import { StatusApi } from "./status/index.js"

export const HomelabApi = HttpApi.make("homelab")
  .add(MobileConfigApi)
  .add(StatusApi)
  .prefix("/homelab")

export * as MobileConfigEndpoints from "./mobile-config/index.js"
export * as StatusEndpoints from "./status/index.js"

export { MobileConfigApi }
