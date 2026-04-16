import { HttpApiGroup } from "@effect/platform"
import * as OAuthAuthorizationServer from "./oauth-authorization-server.js"

export const WellKnownApi = HttpApiGroup.make("well-known")
  .add(OAuthAuthorizationServer.OAuthAuthorizationWellKnownEndpoint)
  .prefix("/.well-known")

export * as OAuthAuthorizationServer from "./oauth-authorization-server.js"
