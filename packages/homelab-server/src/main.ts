import { FetchHttpClient, HttpApiBuilder, HttpApiSwagger, HttpMiddleware } from "@effect/platform"
import { NodeFileSystem, NodeHttpServer, NodeRuntime } from "@effect/platform-node"
import { Console, Effect, Layer } from "effect"
import { Config as NodeConfig, Layers, Shell } from "homelab-services-node"
import { createServer } from "http"
import { ApiLive } from "./api.js"
import { EnvLive } from "./env.js"
import { ProfileUuidConfigLive } from "./uuids.js"

const ServerLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiSwagger.layer()),
  Layer.provide(ApiLive),
  Layer.provide(NodeHttpServer.layer(() => createServer(), { port: 3000, host: "0.0.0.0" })),
  Layer.provide(Shell.Authentication.Aggregate),
  Layer.provide(Shell.Authorization.Aggregate),
  Layer.provide(Shell.Crypto.Aggregate),
  Layer.provide(Shell.ProfilePayload.Aggregate),
  Layer.provide(Layers.UuidService.UuidServiceLive),
  Layer.provide(ProfileUuidConfigLive),
  Layer.provide(NodeConfig.ConfigLive),
  Layer.provide(EnvLive),
  Layer.provide(NodeFileSystem.layer),
  Layer.provide(FetchHttpClient.layer),
  Layer.provide(Layer.succeed(FetchHttpClient.Fetch, globalThis.fetch)),
)

NodeRuntime.runMain(
  Effect.tap(
    Layer.launch(ServerLive),
    () => Console.log("Listening on http://localhost:3000, docs at http://localhost:3000/docs"),
  ),
)
