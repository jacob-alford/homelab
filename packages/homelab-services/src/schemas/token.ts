import { Schema } from "effect"

export const TokenResponse = Schema.Struct({
  access_token: Schema.String,
  token_type: Schema.Literal("DPoP"),
})
