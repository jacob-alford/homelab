import { HttpApiError, HttpApiSchema } from "@effect/platform"
import { Effect, ParseResult, Schema } from "effect"
import type { Identity } from "../identity.js"
import { Operation } from "../operation.js"
import type { ResourceURIs } from "../resource-uris.js"
import { OptionalString, OptionalUnknown } from "../schemas/optionals.js"
import { ResourceURISchema } from "../schemas/resource-uris.js"

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
    description: "An error raised when one or more aspects of the request are not found",
  }),
) {}

export const BadRequestReasonsSchema = Schema.Literal(
  "eap-client-username-required",
  "acme-invalid-client-identifier",
)

export class BadRequest extends Schema.TaggedError<BadRequest>()(
  "BadRequest",
  {
    ...BaseHttpErrorSchema.fields,
    reason: BadRequestReasonsSchema,
  },
  HttpApiSchema.annotations({
    status: 400,
    description: "An error raised when one or more aspects of the request are not valid",
  }),
) {}

export class InternalServerError extends Schema.TaggedError<InternalServerError>()(
  "InternalServerError",
  { ...BaseHttpErrorSchema.fields, error: OptionalUnknown },
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

export const AuthenticationErrorReasonsSchema = Schema.Literal(
  "not-authenticated",
  "failed-to-verify",
  "invalid-credential",
  "expired-credential",
  "invalid-claims",
  "signature-validation-failed",
)

export class AuthenticationError extends Schema.TaggedError<AuthenticationError>()(
  "AuthorizationError",
  {
    ...BaseHttpErrorSchema.fields,
    endpoint: OptionalString,
    reason: AuthenticationErrorReasonsSchema,
    error: OptionalUnknown,
  },
  HttpApiSchema.annotations({
    status: 401,
    description: "An error raised when an aspect of the request's authentication is invalid.",
  }),
) {
}

export class AuthorizationError extends Schema.TaggedError<AuthorizationError>()(
  "AuthorizationError",
  { ...BaseHttpErrorSchema.fields, resource: ResourceURISchema, operation: Schema.Enums(Operation) },
  HttpApiSchema.annotations({
    status: 403,
    description:
      "An error raised when the authenticated caller of a request is not authorized to perform an aspect of the request.",
  }),
) {
  static fromFGA(identity: Identity, operation: Operation, resource: ResourceURIs): AuthorizationError {
    return new AuthorizationError({
      message: `${identity} is not allowed to perform ${operation} on ${resource}`,
      operation,
      resource,
    })
  }

  static fromFeatureFlag(resource: ResourceURIs, operation: Operation): AuthorizationError {
    return new AuthorizationError({
      message: `${operation} is not enabled for ${resource}`,
      operation,
      resource,
    })
  }
}

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
