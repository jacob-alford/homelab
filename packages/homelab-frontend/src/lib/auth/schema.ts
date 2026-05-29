import { Schema } from "effect"

export const TokenResponse = Schema.Struct({
  access_token: Schema.String,
  token_type: Schema.String,
  expires_in: Schema.optional(Schema.Number),
  id_token: Schema.optional(Schema.String),
  scope: Schema.optional(Schema.String),
})

export type TokenResponse = typeof TokenResponse.Type
