import { HttpApiGroup } from "@effect/platform"
import { BasicAuthMiddleware } from "../../middleware/basic-auth-middleware.js"
import * as Token from "./token.js"

export const OAuthApi = HttpApiGroup.make("oauth")
  .add(Token.TokenEndpoint)
  .prefix("/oauth")
  .middleware(BasicAuthMiddleware)

export * as Token from "./token.js"
