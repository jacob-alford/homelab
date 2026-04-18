import type { Effect } from "effect"
import type { ResourceURISchema } from "./schemas/resource-uris.js"

export type ResourceURIs = typeof ResourceURISchema.Type

export type URIMatchers<ExtraParams extends ReadonlyArray<any>> = {
  [K in ResourceURIs]: (params: unknown, ...extraParams: ExtraParams) => any
}

export type UnifyReturnType<Matchers extends URIMatchers<ExtraParams>, ExtraParams extends ReadonlyArray<any>> =
  ReturnType<Matchers[ResourceURIs]> extends Effect.Effect<infer A, infer E, infer R> ? Effect.Effect<A, E, R> : never

export function match<URI extends ResourceURIs, ExtraParams extends ReadonlyArray<any>>(
  uri: URI,
  params: unknown,
  ...extraParams: ExtraParams
): <Matchers extends URIMatchers<ExtraParams>>(
  matchers: Matchers,
) => UnifyReturnType<Matchers, ExtraParams> {
  return function matchInner(matchers) {
    return matchers[uri](params, ...extraParams)
  }
}
