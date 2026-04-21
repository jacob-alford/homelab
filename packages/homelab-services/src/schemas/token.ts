import { identity, Schema } from "effect"
import * as OAuthSchemas from "./OAuth.js"

export const AuthorizationHeader = Schema.String.pipe(
  Schema.pattern(/^[A-Za-z0-9_\-. ]+$/g),
)

export const TokenResponse = Schema.Struct({
  access_token: Schema.String,
  token_type: Schema.Literal("DPoP"),
})

export const LowercaseTokenHeaders = Schema.Struct({
  authorization: AuthorizationHeader,
  dpop: OAuthSchemas.JWTString,
})

export const CaseAgnosticTokenHeaders = Schema.Union(
  LowercaseTokenHeaders,
  Schema.Struct({
    Authorization: AuthorizationHeader,
    DPoP: OAuthSchemas.JWTString,
  }),
)

export const TokenHeaders = CaseAgnosticTokenHeaders
  .pipe(
    Schema.transform(
      CaseAgnosticTokenHeaders,
      {
        decode(to) {
          const isLowercase = Schema.is(LowercaseTokenHeaders)

          if (isLowercase(to)) {
            return to
          } else {
            return { authorization: to.Authorization, dpop: to.DPoP }
          }
        },

        encode: identity,
      },
    ),
  )
