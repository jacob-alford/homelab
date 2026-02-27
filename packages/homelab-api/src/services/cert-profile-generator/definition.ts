import type { Effect } from "effect"
import { Context } from "effect"

import type { ApiErrors } from "../../index.js"
import type * as Schemas from "../../schemas/index.js"

export const CertProfileServiceId = "homelab-api/services/cert-profile-generator/CertProfileService"

export interface CertProfileServiceDef {
  readonly certProfile: Effect.Effect<Schemas.RootPayload.RootPayloadWire, ApiErrors.HttpApiEncodeError>
}

export class CertProfileService extends Context.Tag(CertProfileServiceId)<CertProfileService, CertProfileServiceDef>() {
}
