import type { Effect } from "effect"
import { Context } from "effect"

import type * as Schemas from "../../schemas/index.js"

export const CertConfigServiceId = "homelab-api/services/cert-config-service/CertConfigService"

export interface CertConfigServiceDef {
  rootCert(
    filename: string,
    payload: Buffer,
  ): Effect.Effect<Schemas.CertificatePayload.CertificateConfig>

  intermediateCert(
    filename: string,
    payload: Buffer,
  ): Effect.Effect<Schemas.CertificatePayload.CertificateConfig>
}

export class CertConfigService extends Context.Tag(CertConfigServiceId)<CertConfigService, CertConfigServiceDef>() {
}
