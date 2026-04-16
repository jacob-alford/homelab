import { Headers, HttpApiMiddleware, HttpApiSecurity, HttpServerRequest } from "@effect/platform"
import { Array, Context, Effect, flow, Layer, Option, Redacted, Schema, String } from "effect"

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

const extractBasicPassword: (authHeader: string) => Option.Option<string> = flow(
  String.match(/^Basic (.+)$/),
  Option.flatMap(Array.get(1)),
  Option.map((encoded) => Buffer.from(encoded, "base64").toString("utf8")),
  Option.map((decoded) => decoded.slice(decoded.indexOf(":") + 1)),
  Option.filter(String.isNonEmpty),
)

const extractDPopTokens: (dpopHeader: string) => ReadonlyArray<string> = flow(
  String.split(", "),
  Array.filterMap(
    flow(
      String.trim,
      Option.liftPredicate(String.isNonEmpty),
    ),
  ),
)

export const BasicAuthMiddlewareLive = Layer.succeed(
  BasicAuthMiddleware,
  {
    apiKey: (authHeader: Redacted.Redacted) =>
      Effect.gen(function*() {
        const apiKey = extractBasicPassword(Redacted.value(authHeader))
        const request = yield* HttpServerRequest.HttpServerRequest
        const dpopTokens = Headers.get(request.headers, "dpop").pipe(
          Option.andThen(extractDPopTokens),
          Option.getOrElse(() => Array.empty<string>()),
        )
        return { apiKey, dpopTokens }
      }),
  },
)
