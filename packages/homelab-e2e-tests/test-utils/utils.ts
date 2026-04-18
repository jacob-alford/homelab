import { HttpClient, HttpClientRequest } from "@effect/platform"
import { Effect } from "effect"

export const callWithHeaders = <A, E, R>(
  headers: Record<string, string>,
  effect: Effect.Effect<A, E, R | HttpClient.HttpClient>,
): Effect.Effect<A, E, R | HttpClient.HttpClient> =>
  Effect.gen(function*() {
    const httpClient = yield* HttpClient.HttpClient
    return yield* Effect.provideService(
      effect,
      HttpClient.HttpClient,
      httpClient.pipe(HttpClient.mapRequest(HttpClientRequest.setHeaders(headers))),
    )
  })
