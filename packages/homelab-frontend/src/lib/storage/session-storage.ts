import { Effect, Layer, Option } from "effect"
import { StorageService } from "./service.js"

export const SessionStorageServiceLive = Layer.succeed(
  StorageService,
  {
    get: (key) =>
      Effect.sync(() => {
        const value = sessionStorage.getItem(key)
        return value !== null ? Option.some(value) : Option.none()
      }),
    set: (key, value) => Effect.sync(() => sessionStorage.setItem(key, value)),
    remove: (key) => Effect.sync(() => sessionStorage.removeItem(key)),
  },
)
