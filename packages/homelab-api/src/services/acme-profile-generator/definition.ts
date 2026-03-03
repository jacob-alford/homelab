import { Context, Effect } from "effect"

import type * as ApiErrors from "../../errors/http-errors.js"
import type * as Schemas from "../../schemas/index.js"
import type { AcmeConfigService } from "../acme-config-service/definition.js"

export const AcmeProfileServiceId = "homelab-api/services/acme-profile-generator/AcmeProfileGenerator"

export interface AcmeProfileServiceDef {
  acmeProfile(
    ...params: Parameters<typeof AcmeConfigService.Service.acmeConfig>
  ): Effect.Effect<Schemas.RootPayload.RootPayloadWire, ApiErrors.HttpApiEncodeError>
}

export class AcmeProfileService extends Context.Tag(AcmeProfileServiceId)<AcmeProfileService, AcmeProfileServiceDef>() {
}

export function acmeProfile(
  ...args: Parameters<AcmeProfileServiceDef["acmeProfile"]>
): Effect.Effect<
  Schemas.RootPayload.RootPayloadWire,
  ApiErrors.HttpApiEncodeError,
  AcmeProfileService
> {
  return AcmeProfileService.pipe(
    Effect.andThen(
      (_) => _.acmeProfile(...args),
    ),
  )
}
