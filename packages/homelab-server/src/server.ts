import { NodeHttpServer } from "@effect/platform-node"
import { Config, Layer } from "effect"
import { createServer } from "http"

export const HttpServerLive = Layer.unwrapEffect(
  Config.all({
    port: Config.integer("PORT"),
    host: Config.withDefault(Config.string("HOST"), "127.0.0.1"),
  }).pipe(
    Config.map(({ host, port }) => NodeHttpServer.layer(() => createServer(), { port, host })),
  ),
)
