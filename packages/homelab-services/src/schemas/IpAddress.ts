import { Schema } from "effect"

export const IpAddress = Schema.String.pipe(
  Schema.brand("IpAddress"),
)

export type IpAddress = typeof IpAddress.Type
