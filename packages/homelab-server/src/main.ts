import { HttpApiBuilder, HttpApiSwagger, HttpMiddleware } from "@effect/platform"
import { BunHttpServer, BunRuntime } from "@effect/platform-bun"
import { Layer } from "effect"
import { ApiLive } from "./api.js"

const HomeLabApiLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiSwagger.layer()),
  Layer.provide(ApiLive),
  Layer.provide(
    BunHttpServer.layer({ port: 3000 }),
  ),
)

Layer.launch(
  HomeLabApiLive,
).pipe(
  BunRuntime.runMain,
)
