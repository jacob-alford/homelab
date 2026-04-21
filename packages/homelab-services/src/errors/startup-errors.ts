import { Schema } from "effect"

export class JWKPrivateKeyDecryptionError extends Schema.TaggedError<JWKPrivateKeyDecryptionError>()(
  "JWKPrivateKeyDecryptionError",
  {
    error: Schema.Unknown,
  },
) {}

export class JWKPrivateKeyImportError extends Schema.TaggedError<JWKPrivateKeyImportError>()(
  "JWKPrivateKeyImportError",
  {
    error: Schema.Unknown,
  },
) {}
