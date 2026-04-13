import { Schema } from "effect"

export const HTTPMethod = Schema.Literal(
  "GET",
  "HEAD",
  "PUT",
  "PATCH",
  "POST",
  "DELETE",
  "CONNECT",
  "TRACE",
)

export type HTTPMethod = typeof HTTPMethod.Type
