import type { Option } from "effect"
import { Context, Effect } from "effect"
import type { AuthenticationError, BadRequest, InternalServerError } from "../../errors/http-errors.js"
import { type HTTPMethod } from "../../schemas/HTTPMethod.js"
import type { HMACDigestError } from "../hmac-service/definition.js"
import type { NonceValidationError } from "../nonce-service/definition.js"

export const TokenIssuerServiceId = "homelab-api/services/token-issuer-service/TokenIssuerService"

export interface TokenIssueResult {
  readonly accessToken: string
  readonly nonce: string
}

export interface TokenIssuerServiceDef {
  readonly issueToken: (
    expectedHtu: URL,
    expectedHtm: HTTPMethod,
    apiKey: Option.Option<string>,
    dpopTokens: ReadonlyArray<string>,
  ) => Effect.Effect<
    TokenIssueResult,
    AuthenticationError | BadRequest | InternalServerError | NonceValidationError | HMACDigestError
  >
}

export class TokenIssuerService extends Context.Tag(TokenIssuerServiceId)<TokenIssuerService, TokenIssuerServiceDef>() {
}

export function issueToken(
  ...params: Parameters<TokenIssuerServiceDef["issueToken"]>
): Effect.Effect<
  TokenIssueResult,
  AuthenticationError | BadRequest | InternalServerError | NonceValidationError | HMACDigestError,
  TokenIssuerService
> {
  return TokenIssuerService.pipe(
    Effect.flatMap(
      (_) => _.issueToken(...params),
    ),
  )
}
