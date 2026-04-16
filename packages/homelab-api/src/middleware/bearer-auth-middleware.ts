import { Headers, HttpApiMiddleware, HttpServerRequest } from "@effect/platform"
import { Array, Context, Effect, flow, Layer, Option, pipe, Record, RegExp, Schema, String, Tuple } from "effect"
import * as Env from "../config/env.js"
import * as ApiErrors from "../errors/http-errors.js"
import type { Identity } from "../identity.js"
import type { HTTPMethod } from "../schemas/HTTPMethod.js"
import { AuthenticationService } from "../services/authentication-service/definition.js"

export class CurrentIdentity extends Context.Tag("homelab-api/CurrentIdentity")<CurrentIdentity, Identity>() {}

export class AuthMiddleware extends HttpApiMiddleware.Tag<AuthMiddleware>()("AuthMiddleware", {
  failure: Schema.Union(ApiErrors.AuthenticationError, ApiErrors.BadRequest, ApiErrors.InternalServerError),
  provides: CurrentIdentity,
}) {}

const extractBearerTokens: (authHeader: string) => ReadonlyArray<Buffer> =
  // effect joins multiple http headers with commas:
  // https://github.com/Effect-TS/effect/blob/ec5c50507b1a2f5ad712c148a7da0fadb8cb9f52/packages/platform/src/Headers.ts#L109
  flow(
    String.split(", "),
    Array.filterMap(
      flow(
        String.match(/^Bearer (.*)$/),
        Option.flatMap(
          Array.get(1),
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
  AuthMiddleware,
  Effect.gen(function*() {
    const authService = yield* AuthenticationService
    const origin = yield* Env.originUrl

    // @effect-diagnostics returnEffectInGen:off
    return Effect.gen(function*() {
      const request = yield* HttpServerRequest.HttpServerRequest

      const jwt = yield* Headers.get(request.headers, "authorization").pipe(
        Option.map(extractBearerTokens),
        Effect.liftPredicate(
          (tokens) =>
            Option.exists(
              tokens,
              (tokens) => tokens.length === 1,
            ),
          () =>
            new ApiErrors.AuthenticationError({
              reason: "invalid-credential",
              message: "Received multiple bearer tokens",
            }),
        ),
        Effect.map(Option.andThen(Array.get(0))),
      )

      const dpopTokens = Headers.get(request.headers, "dpop").pipe(
        Option.andThen(extractDPopTokens),
        Option.getOrElse(() => Array.empty<string>()),
      )

      const htu = new URL(request.url, origin)
      const htm = request.method as HTTPMethod

      return yield* authService.authenticate(jwt, htu, htm, dpopTokens)
        .pipe(
          Effect.mapError((e) => {
            if (e._tag === "NonceValidationError") {
              return new ApiErrors.AuthenticationError({
                reason: "invalid-credential",
                message: e.message,
              })
            }
            if (e._tag === "HMACDigestError") {
              return new ApiErrors.InternalServerError({
                message: "HMAC error during authentication",
                error: e,
              })
            }
            return e
          }),
        )
    })
  }),
)
