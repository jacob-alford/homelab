import { FetchHttpClient, type HttpClient } from "@effect/platform"
import { Effect, Layer } from "effect"
import { AstroConfigProvider } from "../config-provider.js"
import { SessionStorageServiceLive, type StorageService } from "../storage/index.js"

const RuntimeLayer = Layer.mergeAll(FetchHttpClient.layer, SessionStorageServiceLive)

export type AppRequirements = HttpClient.HttpClient | StorageService

export const runEffect = <A, E>(effect: Effect.Effect<A, E, AppRequirements>) =>
  Effect.runPromise(
    effect.pipe(
      Effect.provide(RuntimeLayer),
      Effect.withConfigProvider(AstroConfigProvider),
    ),
  )
