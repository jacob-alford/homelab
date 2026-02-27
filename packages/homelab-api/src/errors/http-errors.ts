import { HttpApiError, HttpApiSchema } from "@effect/platform"
import { Effect, ParseResult, Schema } from "effect"

export const BaseHttpErrorSchema = Schema.Struct({
  message: Schema.String,
})

export const NotFoundReasonsSchema = Schema.Literal(
  "ssid-not-found",
)

export class NotFound extends Schema.TaggedError<NotFound>()(
  "NotFound",
  {
    ...BaseHttpErrorSchema.fields,
    reason: NotFoundReasonsSchema,
  },
  HttpApiSchema.annotations({
    status: 404,
    description: "An error raised when one or more aspects of the request is not found",
  }),
) {}

export const BadRequestReasonsSchema = Schema.Literal(
  "eap-client-username-required",
)

export class BadRequest extends Schema.TaggedError<BadRequest>()(
  "BadRequest",
  {
    ...BaseHttpErrorSchema.fields,
    reason: BadRequestReasonsSchema,
  },
  HttpApiSchema.annotations({
    status: 400,
    description: "An error raised when one or more aspects of the request is not valid",
  }),
) {}

export class InternalServerError extends Schema.TaggedError<InternalServerError>()(
  "InternalServerError",
  BaseHttpErrorSchema.fields,
  HttpApiSchema.annotations({
    status: 500,
    description: "An error raised when an unrecoverable error has occurred and warrants investigation",
  }),
) {}

export class NotImplemented extends Schema.TaggedError<NotImplemented>()(
  "NotImplemented",
  {
    ...BaseHttpErrorSchema.fields,
    internalMethod: Schema.String.pipe(Schema.optionalWith({ exact: true })),
  },
  HttpApiSchema.annotations({
    status: 501,
    description: "An error raised when an aspect of the request handler is not yet implemented",
  }),
) {}

export class HttpApiEncodeError extends Schema.TaggedError<HttpApiEncodeError>()(
  "HttpApiDecodeError",
  {
    issues: Schema.Array(HttpApiError.Issue),
    message: Schema.String,
  },
  HttpApiSchema.annotations({
    status: 500,
    description: "There was a problem serializing the response",
  }),
) {
  static fromParseError(error: ParseResult.ParseError): Effect.Effect<never, HttpApiEncodeError> {
    return ParseResult.ArrayFormatter.formatError(error).pipe(
      Effect.zip(ParseResult.TreeFormatter.formatError(error)),
      Effect.map(([issues, message]) => new HttpApiEncodeError({ issues, message })),
      Effect.andThen(Effect.fail),
    )
  }
}
