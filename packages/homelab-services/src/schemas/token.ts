import { Schema } from "effect"
import * as OAuthSchemas from "./OAuth.js"
import { Optional } from "./optionals.js"

export const AuthorizationHeader = Schema.String.pipe(
  Schema.pattern(/^[A-Za-z0-9_\-. ]+$/g),
)

export const TokenResponse = Schema.Struct({
  access_token: Schema.String,
  token_type: Schema.Literal("DPoP"),
})

export const TokenHeaders = Schema.Struct({
  authorization: Optional(AuthorizationHeader),
  dpop: Optional(OAuthSchemas.JWTString),
})
