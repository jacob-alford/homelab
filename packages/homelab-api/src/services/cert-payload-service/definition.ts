import type { Effect } from "effect"
import { Context } from "effect"

import type { CertificatePayload } from "homelab-api/schemas/index"
import type { UuidGenerationError } from "../uuid-service/index.js"

export const CertPayloadServiceId = "homelab-api/services/wifi-profile-generator/WifiProfileGenerator"

export interface CertPayloadServiceDef {
  cert(
    filename: string,
    payload: Buffer,
    type: "root" | "intermediate",
  ): Effect.Effect<CertificatePayload.CertificatePayload, UuidGenerationError>
}

export class CertPayloadService extends Context.Tag(CertPayloadServiceId)<CertPayloadService, CertPayloadServiceDef>() {
}
