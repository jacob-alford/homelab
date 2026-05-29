import { HttpApiGroup } from "@effect/platform"
import * as ClaimCheck from "./claim-check.js"
import * as Token from "./token.js"

export const OAuthApi = HttpApiGroup.make("oauth")
  .add(Token.TokenEndpoint)
  .add(ClaimCheck.ClaimCheckEndpoint)
  .prefix("/oauth")

export * as ClaimCheck from "./claim-check.js"
export * as Token from "./token.js"
