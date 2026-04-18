import { HttpApiMiddleware, HttpApiSecurity } from "@effect/platform"
import { Context, type Option, Schema } from "effect"

export interface BasicAuthCredentialsDef {
  readonly apiKey: Option.Option<string>
  readonly dpopTokens: ReadonlyArray<string>
}

export class BasicAuthCredentials extends Context.Tag("homelab-api/BasicAuthCredentials")<
  BasicAuthCredentials,
  BasicAuthCredentialsDef
>() {}

export class BasicAuthMiddleware extends HttpApiMiddleware.Tag<BasicAuthMiddleware>()(
  "BasicAuthMiddleware",
  {
    failure: Schema.Never,
    provides: BasicAuthCredentials,
    security: {
      apiKey: HttpApiSecurity.apiKey({ in: "header", key: "Authorization" }),
    },
  },
) {}
