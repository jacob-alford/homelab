import { FetchHttpClient, HttpApiBuilder, HttpApiSwagger, HttpClient, HttpMiddleware } from "@effect/platform"
import { NodeFileSystem, NodeRuntime } from "@effect/platform-node"
import { Effect, Layer } from "effect"
import { Layers, Shell } from "homelab-services-node"
import { ApiLive } from "./api.js"
import { EnvLive } from "./env.js"
import { LoggerLive } from "./logger.js"
import { HttpServerLive } from "./server.js"
import { ProfileUuidConfigLive } from "./uuids.js"

const Server = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiSwagger.layer()),
  Layer.provide(HttpApiBuilder.middlewareOpenApi()),
  Layer.provide(LoggerLive),
  Layer.provide(ApiLive),
  Layer.provide(Shell.Authentication.Aggregate),
  Layer.provide(Shell.Authorization.Aggregate),
  Layer.provide(Shell.Crypto.Aggregate),
  Layer.provide(Shell.ProfilePayload.Aggregate),
  Layer.provide(Layers.CertificateService.CertificateServiceLive),
  Layer.provide(Layers.UuidService.UuidServiceLive),
  Layer.provide(ProfileUuidConfigLive),
  Layer.provide(Shell.Config.ConfigLive),
  Layer.provide(EnvLive),
  Layer.provide(NodeFileSystem.layer),
  Layer.provide(
    Layer.effect(
      HttpClient.HttpClient,
      Effect.map(HttpClient.HttpClient, HttpClient.filterStatusOk),
    ).pipe(Layer.provide(FetchHttpClient.layer)),
  ),
  Layer.provide(Layer.succeed(FetchHttpClient.Fetch, globalThis.fetch)),
  Layer.provide(HttpServerLive),
  Layer.tapError(Effect.logFatal),
)

NodeRuntime.runMain(
  Layer.launch(Server),
  {
    disablePrettyLogger: true,
    disableErrorReporting: false,
  },
)
