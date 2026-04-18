import { Schema } from "effect"
import { JSONExtensions } from "./JSONExt.js"

export const GenericPayloadSchema = Schema.Struct({
  PayloadContent: JSONExtensions.pipe(Schema.optionalWith({ exact: true })),
  PayloadDescription: Schema.String,
  PayloadDisplayName: Schema.String,
  PayloadIdentifier: Schema.String,
  PayloadOrganization: Schema.String.pipe(Schema.optionalWith({ exact: true })),
  PayloadRemovalDisallowed: Schema.Boolean.pipe(Schema.optionalWith({ exact: true })),
  PayloadType: Schema.String,
  PayloadScope: Schema.String.pipe(Schema.optionalWith({ exact: true })),
  PayloadUUID: Schema.UUID,
  PayloadVersion: Schema.Int.pipe(Schema.positive()),
})
