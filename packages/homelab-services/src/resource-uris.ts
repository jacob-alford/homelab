import type { Effect } from "effect"
import type { ResourceURISchema } from "./schemas/resource-uris.js"

export type ResourceURIs = typeof ResourceURISchema.Type

export interface URIToParams {}

export type DeclaredURIs = keyof URIToParams

export type AllParams = URIToParams[DeclaredURIs]

export type URIMatchers<ExtraParams extends ReadonlyArray<any>> = {
  [K in DeclaredURIs]: (params: URIToParams[K], ...extraParams: ExtraParams) => any
}

export type UnifyReturnType<Matchers extends URIMatchers<ExtraParams>, ExtraParams extends ReadonlyArray<any>> =
  ReturnType<Matchers[DeclaredURIs]> extends Effect.Effect<infer A, infer E, infer R> ? Effect.Effect<A, E, R> : never

export function match<ExtraParams extends ReadonlyArray<any>>(
  uri: DeclaredURIs,
  params: AllParams,
  ...extraParams: ExtraParams
): <Matchers extends URIMatchers<ExtraParams>>(
  matchers: Matchers,
) => UnifyReturnType<Matchers, ExtraParams> {
  return function matchInner(matchers) {
    return (matchers[uri] as any)(params, ...extraParams)
  }
}
