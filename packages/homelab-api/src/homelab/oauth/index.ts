import { HttpApiGroup } from "@effect/platform"
import { Middleware } from "homelab-services"
import * as Token from "./token.js"

export const OAuthApi = HttpApiGroup.make("oauth")
  .add(Token.TokenEndpoint)
  .prefix("/oauth")
  .middleware(Middleware.BasicAuthMiddleware)

export * as Token from "./token.js"
