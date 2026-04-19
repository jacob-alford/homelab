import { Schema } from "effect"

export class JWKPrivateKeyDecryptionError extends Schema.TaggedError<JWKPrivateKeyDecryptionError>()(
  "JWKPrivateKeyDecryptionError",
  {
    error: Schema.Unknown,
  },
) {}
