import { FetchHttpClient } from "@effect/platform"
import { Effect, Layer } from "effect"
import { onMount } from "solid-js"
import { consumeReturnUrl, handleOIDCCallback, setAuth } from "../lib/auth/index.js"
import { AstroConfigProvider } from "../lib/config-provider.js"
import { SessionStorageServiceLive } from "../lib/storage/index.js"
import { showErrorToast } from "./Toast/index.js"

const RuntimeLayer = Layer.mergeAll(FetchHttpClient.layer, SessionStorageServiceLive)

export function OAuthCallback() {
  onMount(() => {
    const program = Effect.gen(function*() {
      const tokenResponse = yield* handleOIDCCallback()
      setAuth(tokenResponse)
      const returnUrl = yield* consumeReturnUrl()
      yield* Effect.sync(() => {
        window.location.href = returnUrl
      })
    })

    Effect.runPromise(
      program.pipe(
        Effect.provide(RuntimeLayer),
        Effect.withConfigProvider(AstroConfigProvider),
      ),
    ).catch((err) => {
      console.error("[OAuthCallback] error:", err)
      showErrorToast(err instanceof Error ? err.message : "Authentication failed")
    })
  })

  return null
}
