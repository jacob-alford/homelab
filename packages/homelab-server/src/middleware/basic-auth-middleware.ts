import { Headers, HttpServerRequest } from "@effect/platform"
import { Array, Effect, flow, Layer, Option, Redacted, String } from "effect"
import { Middleware } from "homelab-services"

const extractBasicPassword: (authHeader: string) => Option.Option<string> = flow(
  Option.some,
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
  Middleware.BasicAuthMiddleware,
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
