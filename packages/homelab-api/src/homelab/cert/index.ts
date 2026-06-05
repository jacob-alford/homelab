import { HttpApiGroup } from "@effect/platform"
import { Middleware } from "homelab-services"
import * as Combined from "./combined.js"
import * as Intermediate from "./intermediate.js"
import * as Root from "./root.js"

export const CertApi = HttpApiGroup.make("cert")
  .add(Root.RootCert)
  .add(Intermediate.IntermediateCert)
  .add(Combined.CombinedCert)
  .prefix("/cert")
  .middleware(Middleware.AuthMiddleware)

export * as Combined from "./combined.js"
export * as Intermediate from "./intermediate.js"
export * as Root from "./root.js"
