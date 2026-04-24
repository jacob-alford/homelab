import { Headers, HttpServerRequest } from "@effect/platform"
import { Array, Effect, flow, Layer, Option, String } from "effect"
import { constTrue } from "effect/Function"
import { ApiErrors, Config, Middleware, type Schemas, Services } from "homelab-services"

const extractBearerTokens: (authHeader: string) => ReadonlyArray<Buffer> =
  // effect joins multiple http headers with commas:
  // https://github.com/Effect-TS/effect/blob/ec5c50507b1a2f5ad712c148a7da0fadb8cb9f52/packages/platform/src/Headers.ts#L109
  flow(
    String.split(", "),
    Array.filterMap(
      flow(
        String.match(/^(Bearer|DPoP) (.*)$/),
        Option.flatMap(
          Array.get(2),
        ),
        Option.map(String.trim),
        Option.filter(
          String.isNonEmpty,
        ),
        Option.map(
          (_) => Buffer.from(_, "utf8"),
        ),
      ),
    ),
  )

const extractDPopTokens: (dpopHeader: string) => ReadonlyArray<string> = flow(
  String.split(", "),
  Array.filterMap(
    flow(
      String.trim,
      Option.liftPredicate(
        String.isNonEmpty,
      ),
    ),
  ),
)

export const AuthMiddlewareLive = Layer.effect(
  Middleware.AuthMiddleware,
  Effect.gen(function*() {
    const authService = yield* Services.AuthenticationService.AuthenticationService
    const origin = yield* Config.Env.originUrl

    // @effect-diagnostics returnEffectInGen:off
    return Effect.gen(function*() {
      const request = yield* HttpServerRequest.HttpServerRequest

      const jwt = yield* Headers.get(request.headers, "authorization").pipe(
        Option.map(extractBearerTokens),
        Effect.liftPredicate(
          (_) =>
            Option.match(_, {
              onNone: constTrue,
              onSome(
                tokens,
              ) {
                return tokens.length <= 1
              },
            }),
          () =>
            new ApiErrors.AuthenticationError({
              reason: "invalid-credential",
              message: `Recieved Empty or Numerous Bearer Tokens`,
            }),
        ),
        Effect.map(Option.andThen(Array.get(0))),
      )

      const dpopTokens = Headers.get(request.headers, "dpop").pipe(
        Option.andThen(extractDPopTokens),
        Option.getOrElse(() => Array.empty<string>()),
      )

      const htu = new URL(request.url, origin)
      const htm = request.method as Schemas.HTTPMethod.HTTPMethod

      return yield* authService.authenticate(jwt, htu, htm, dpopTokens)
        .pipe(
          Effect.catchTags({
            NonceValidationError(error) {
              return new ApiErrors.AuthenticationError({
                reason: "invalid-credential",
                message: "Failed to validate nonce",
                error,
              })
            },
            HMACDigestError(error) {
              return new ApiErrors.InternalServerError({
                message: "HMAC error during authentication",
                error,
              })
            },
          }),
        )
    })
  }),
)
