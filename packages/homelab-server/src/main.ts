import { BunHttpServer, BunRuntime } from "@effect/platform-bun"
import { HttpApiBuilder, HttpApiSwagger, HttpMiddleware, HttpServer } from "@effect/platform"
import { Effect, Layer } from "effect"
import { Homelab } from "homelab-api"

const ApiLive = HttpApiBuilder.api(Homelab.HomelabApi).pipe(
  Layer.provide(HttpApiBuilder.middlewareCors())
)

const HttpLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiSwagger.layer()),
  Layer.provide(ApiLive),
  Layer.provide(BunHttpServer.layerServer({ port: 3000 }))
)

BunRuntime.runMain(
  Layer.launch(HttpLive).pipe(
    Effect.tap(() => Effect.log("Server started on http://localhost:3000")),
    Effect.tap(() => Effect.log("Swagger docs available at http://localhost:3000/docs"))
  )
)
