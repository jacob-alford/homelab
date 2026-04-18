import { Context, Effect, type Option } from "effect"
import type { JWTVerifyGetKey } from "jose"
import type { JWKs } from "../schemas/OAuth.js"

export const IssuerJwkResolverId = "homelab-api/config/issuer-jwk-resolver-jose/IssuerJwkResolver"

export interface IssuerJwkResolverDef {
  /** Returns a jose-compatible `JWTVerifyGetKey` for the given issuer URL, or `None` if the issuer is unrecognized. */
  getJwkKey(issuer: string): Option.Option<JWTVerifyGetKey>

  /** Returns the raw JWKs for the given issuer URL, or `None` if the issuer is unrecognized. */
  getJwk(issuer: string): Option.Option<JWKs>
}

export class IssuerJwkResolver extends Context.Tag(IssuerJwkResolverId)<IssuerJwkResolver, IssuerJwkResolverDef>() {}

/** {@inheritDoc IssuerJwkResolverDef.getJwkKey} */
export function getJwkKey(issuer: string): Effect.Effect<Option.Option<JWTVerifyGetKey>, never, IssuerJwkResolver> {
  return IssuerJwkResolver.pipe(Effect.map((_) => _.getJwkKey(issuer)))
}

/** {@inheritDoc IssuerJwkResolverDef.getJwk} */
export function getJwk(issuer: string): Effect.Effect<Option.Option<JWKs>, never, IssuerJwkResolver> {
  return IssuerJwkResolver.pipe(Effect.map((_) => _.getJwk(issuer)))
}
