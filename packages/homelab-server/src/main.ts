import { FetchHttpClient, HttpApiBuilder, HttpApiSwagger, HttpClient, HttpMiddleware } from "@effect/platform"
import { NodeFileSystem, NodeRuntime } from "@effect/platform-node"
import { Console, Effect, Layer } from "effect"
import { Config as NodeConfig, Layers, Shell } from "homelab-services-node"
import { ApiLive } from "./api.js"
import { EnvLive } from "./env.js"
import { HttpServerLive } from "./server.js"
import { ProfileUuidConfigLive } from "./uuids.js"

const ServerLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiSwagger.layer()),
  Layer.provide(ApiLive),
  Layer.provide(HttpServerLive),
  Layer.provide(Shell.Authentication.Aggregate),
  Layer.provide(Shell.Authorization.Aggregate),
  Layer.provide(Shell.Crypto.Aggregate),
  Layer.provide(Shell.ProfilePayload.Aggregate),
  Layer.provide(Layers.CertificateService.CertificateServiceLive),
  Layer.provide(Layers.UuidService.UuidServiceLive),
  Layer.provide(ProfileUuidConfigLive),
  Layer.provide(NodeConfig.ConfigLive),
  Layer.provide(EnvLive),
  Layer.provide(NodeFileSystem.layer),
  Layer.provide(
    Layer.effect(
      HttpClient.HttpClient,
      Effect.map(HttpClient.HttpClient, HttpClient.filterStatusOk),
    ).pipe(Layer.provide(FetchHttpClient.layer)),
  ),
  Layer.provide(Layer.succeed(FetchHttpClient.Fetch, globalThis.fetch)),
)

NodeRuntime.runMain(
  Effect.tap(
    Layer.launch(ServerLive),
    () => Console.log("Listening on http://localhost:3000, docs at http://localhost:3000/docs"),
  ),
)
