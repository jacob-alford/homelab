import { HttpApiMiddleware, HttpApiSecurity } from "@effect/platform"
import { Context, Effect, Layer, Option, Redacted, Schema } from "effect"
import * as ApiErrors from "../errors/http-errors.js"
import type { Identity } from "../identity.js"
import { AuthenticationService } from "../services/authentication-service/definition.js"

export class CurrentIdentity extends Context.Tag("homelab-api/CurrentIdentity")<CurrentIdentity, Identity>() {}

export class AuthMiddleware extends HttpApiMiddleware.Tag<AuthMiddleware>()("AuthMiddleware", {
  failure: Schema.Union(ApiErrors.AuthenticationError, ApiErrors.InternalServerError),
  provides: CurrentIdentity,
  security: {
    bearer: HttpApiSecurity.bearer,
  },
}) {}

export const AuthMiddlewareLive = Layer.effect(
  AuthMiddleware,
  Effect.gen(function*() {
    const authService = yield* AuthenticationService

    return {
      bearer: (token: Redacted.Redacted) =>
        Effect.gen(function*() {
          const tokenValue = Redacted.value(token)
          const jwt = tokenValue.length > 0
            ? Option.some(Buffer.from(tokenValue, "utf8"))
            : Option.none()

          return yield* authService.authenticate(jwt)
        }),
    }
  }),
)
