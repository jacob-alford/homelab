import { HttpApi } from "@effect/platform"
import { MobileConfigApi } from "./mobile-config/index.js"

export const HomelabApi = HttpApi.make("homelab").add(MobileConfigApi).prefix("/homelab")

export * as Endpoints from "./mobile-config/index.js"

export { MobileConfigApi }
