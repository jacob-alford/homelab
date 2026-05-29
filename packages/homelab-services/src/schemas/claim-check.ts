import { Schema } from "effect"

export const ClaimCheckResponse = Schema.Struct({
  claim_check: Schema.String,
})

export type ClaimCheckResponse = typeof ClaimCheckResponse.Type
