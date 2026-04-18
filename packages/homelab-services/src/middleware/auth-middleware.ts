import { HttpApiMiddleware } from "@effect/platform"
import { Context, Schema } from "effect"
import * as ApiErrors from "../errors/http-errors.js"
import type { Identity } from "../identity.js"

export class CurrentIdentity extends Context.Tag("homelab-api/CurrentIdentity")<CurrentIdentity, Identity>() {}

export class AuthMiddleware extends HttpApiMiddleware.Tag<AuthMiddleware>()("AuthMiddleware", {
  failure: Schema.Union(ApiErrors.AuthenticationError, ApiErrors.BadRequest, ApiErrors.InternalServerError),
  provides: CurrentIdentity,
}) {}
