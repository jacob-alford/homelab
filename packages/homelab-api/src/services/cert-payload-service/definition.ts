import type { Effect } from "effect"
import { Context } from "effect"

import type * as Schemas from "../../schemas/index.js"

export const CertPayloadServiceId = "homelab-api/services/wifi-profile-generator/WifiProfileGenerator"

export interface CertPayloadServiceDef {
  cert(
    filename: string,
    payload: Buffer,
    type: "root" | "intermediate",
  ): Effect.Effect<Schemas.CertificatePayload.CertificatePayload>
}

export class CertPayloadService extends Context.Tag(CertPayloadServiceId)<CertPayloadService, CertPayloadServiceDef>() {
}
