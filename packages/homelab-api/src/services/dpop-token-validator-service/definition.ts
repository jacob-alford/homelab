import { Context, Effect } from "effect"
import type { AuthenticationError, BadRequest } from "../../errors/http-errors.js"
import type { HTTPMethod } from "../../schemas/HTTPMethod.js"
import type * as OAuth from "../../schemas/OAuth.js"
import type { HMACDigestError } from "../hmac-service/definition.js"
import type { NonceValidationError } from "../nonce-service/definition.js"

export const DPoPTokenValidatorServiceId = "homelab-api/services/dpop-token-validator-service/DPoPTokenValidatorService"

export interface DPoPValidationResult {
  readonly headers: typeof OAuth.DPoPJOSEHeader.Type
  readonly token: typeof OAuth.DPoPProofJWT.Type
  readonly raw: string
}

export interface DPoPTokenValidatorServiceDef {
  readonly validateDPoPToken: (
    expectedHtu: URL,
    expectedHtm: HTTPMethod,
    dpopTokens: ReadonlyArray<string>,
    requireNonce?: boolean,
  ) => Effect.Effect<DPoPValidationResult, AuthenticationError | BadRequest | NonceValidationError | HMACDigestError>
}

export class DPoPTokenValidatorService
  extends Context.Tag(DPoPTokenValidatorServiceId)<DPoPTokenValidatorService, DPoPTokenValidatorServiceDef>()
{
}

export function validateDPoPToken(
  ...params: Parameters<DPoPTokenValidatorServiceDef["validateDPoPToken"]>
): Effect.Effect<
  DPoPValidationResult,
  AuthenticationError | BadRequest | NonceValidationError | HMACDigestError,
  DPoPTokenValidatorService
> {
  return DPoPTokenValidatorService.pipe(
    Effect.flatMap(
      (_) => _.validateDPoPToken(...params),
    ),
  )
}
