import { HttpApiMiddleware, HttpApiSecurity, HttpServerRequest } from "@effect/platform"
import { Context, Effect, Layer, Option, Redacted, Schema } from "effect"

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

function parseBasicAuthPassword(authHeader: string): Option.Option<string> {
  if (!authHeader.startsWith("Basic ")) return Option.none()
  const decoded = Buffer.from(authHeader.slice("Basic ".length), "base64").toString("utf8")
  const password = decoded.slice(decoded.indexOf(":") + 1)
  return password.length > 0 ? Option.some(password) : Option.none()
}

function extractDPopTokens(dpopHeader: string | string[] | undefined): ReadonlyArray<string> {
  if (!dpopHeader) return []
  return Array.isArray(dpopHeader) ? dpopHeader : [dpopHeader]
}

export const BasicAuthMiddlewareLive = Layer.succeed(
  BasicAuthMiddleware,
  {
    apiKey: (authHeader: Redacted.Redacted) =>
      Effect.gen(function*() {
        const apiKey = parseBasicAuthPassword(Redacted.value(authHeader))
        const request = yield* HttpServerRequest.HttpServerRequest
        const dpopTokens = extractDPopTokens(request.headers["dpop"])
        return { apiKey, dpopTokens }
      }),
  },
)
