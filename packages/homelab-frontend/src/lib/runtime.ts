import { FetchHttpClient, type HttpClient } from "@effect/platform"
import { Effect, Layer } from "effect"
import { AstroConfigProvider } from "./env.js"
import * as Storage from "./storage/index.js"

const RuntimeLayer = Layer.mergeAll(FetchHttpClient.layer, Storage.SessionStorage.SessionStorageServiceLive)

export type AppRequirements = HttpClient.HttpClient | Storage.Service.StorageService

export const runEffect = <A, E>(effect: Effect.Effect<A, E, AppRequirements>) =>
  Effect.runPromise(
    effect.pipe(
      Effect.provide(RuntimeLayer),
      Effect.withConfigProvider(AstroConfigProvider),
    ),
  )
