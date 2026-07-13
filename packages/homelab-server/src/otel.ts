import { NodeSdk } from "@effect/opentelemetry"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc"
import { BatchSpanProcessor, ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base"
import { Config, Effect, Option, Schema } from "effect"
import { Schemas } from "homelab-services"

export const OtelLive = NodeSdk.layer(
  Effect.gen(function*() {
    const { homelabCommitHash, otelGrpcEndpointUrl } = yield* Config.all({
      homelabCommitHash: Schema.Config("HOMELAB_COMMIT_HASH", Schemas.CommitHash.ShortCommitHashFromCommitHash),
      otelGrpcEndpointUrl: Config.option(Config.url("OTEL_GRPC_ENDPOINT_URL")),
    })

    const spanProcessor = new BatchSpanProcessor(
      otelGrpcEndpointUrl.pipe(
        Option.match({
          onNone() {
            return new ConsoleSpanExporter()
          },
          onSome(url) {
            return new OTLPTraceExporter({
              url: url.toString(),
            })
          },
        }),
      ),
    )

    return {
      resource: {
        serviceName: "homelab-api",
        serviceVersion: `homelab-api__${homelabCommitHash}`,
      },
      spanProcessor,
    } satisfies NodeSdk.Configuration
  }),
)
