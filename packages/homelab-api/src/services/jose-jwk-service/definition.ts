import { Context, Effect } from "effect"
import type { JWTVerifyGetKey } from "jose"
import type { InternalServerError } from "../../errors/http-errors.js"

export const JoseJWKServiceId = "homelab-api/services/jose-jwk-service/JoseJWKService"

export interface JoseJWKServiceDef {
  getJWK(): Effect.Effect<JWTVerifyGetKey, InternalServerError>
}

export class JoseJWKService extends Context.Tag(JoseJWKServiceId)<JoseJWKService, JoseJWKServiceDef>() {
}

export function getJWK(
  ...params: Parameters<JoseJWKServiceDef["getJWK"]>
): Effect.Effect<JWTVerifyGetKey, InternalServerError, JoseJWKService> {
  return JoseJWKService.pipe(
    Effect.flatMap(
      (_) => _.getJWK(...params),
    ),
  )
}
