import type { Effect } from "effect"

export interface URIToParams {}

export type ResourceURIs = keyof URIToParams

export type Params<K extends ResourceURIs> = URIToParams[K]

export type URIMatchers<ExtraParams extends ReadonlyArray<any>> = {
  [K in ResourceURIs]: (params: Params<K>, ...extraParams: ExtraParams) => any
}

export type UnifyReturnType<Matchers extends URIMatchers<ExtraParams>, ExtraParams extends ReadonlyArray<any>> =
  ReturnType<Matchers[ResourceURIs]> extends Effect.Effect<infer A, infer E, infer R> ? Effect.Effect<A, E, R> : never

export function match<URI extends ResourceURIs, ExtraParams extends ReadonlyArray<any>>(
  uri: URI,
  params: Params<URI>,
  ...extraParams: ExtraParams
): <Matchers extends URIMatchers<ExtraParams>>(
  matchers: Matchers,
) => UnifyReturnType<Matchers, ExtraParams> {
  return function matchInner(matchers) {
    return matchers[uri](params as any, ...extraParams)
  }
}
