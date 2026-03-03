import type { Effect } from "effect"
import { Context } from "effect"

import type * as Schemas from "../../schemas/index.js"

export const AcmeConfigOptionsId = "homelab-api/services/acme-config-service/AcmeConfigOptions"

export class AcmeConfigOptions extends Context.Tag(AcmeConfigOptionsId)<
  AcmeConfigOptions,
  {
    acmeUrl: string
    hardwareBound: boolean
    keyType: string
    keySize: number
  }
>() {}

export const AcmeConfigServiceId = "homelab-api/services/acme-config-service/AcmeConfigService"

export interface AcmeConfigServiceDef {
  acmeConfig(
    clientIdentifier: string,
  ): Effect.Effect<Schemas.ACME.AcmeConfig>
}

export class AcmeConfigService extends Context.Tag(AcmeConfigServiceId)<AcmeConfigService, AcmeConfigServiceDef>() {
}
