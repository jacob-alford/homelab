import { FetchHttpClient, HttpApiBuilder, HttpApiSwagger, HttpMiddleware, Path } from "@effect/platform"
import { NodeFileSystem, NodeHttpServer, NodePath, NodeRuntime } from "@effect/platform-node"
import { Config, Console, Effect, Layer } from "effect"
import { Config as HomelabConfig, Services } from "homelab-api"
import { createServer } from "http"
import { ApiLive } from "./api.js"

const RemoteOIDCProviderURLMapLive = Layer.effect(
  HomelabConfig.OIDCConfigRemote.RemoteOIDCProviderURLMap,
  Effect.gen(function*() {
    const kanidmUrl = yield* Config.string("KANIDM_OIDC_URL")
    return { kanidm: new URL(kanidmUrl) }
  }),
)

const CertificateServiceConfigLayer = Layer.effect(
  Services.CertificateService.CertificateServiceConfig,
  Effect.gen(function*() {
    const path = yield* Path.Path
    const basePath = yield* Config.string("BASE_PATH")
    const rootCertPath = yield* Config.string("ROOT_CERT")
    const intermediateCertPath = yield* Config.string("INTERMEDIATE_CERT")
    return {
      rootCert: path.resolve(basePath, rootCertPath),
      intermediateCert: path.resolve(basePath, intermediateCertPath),
    }
  }),
)

const DPoPChain = Services.DPoPTokenValidatorService.DPoPTokenValidatorServiceLive.pipe(
  Layer.provideMerge(Services.NonceService.NonceServiceLive),
  Layer.provideMerge(Services.HMACService.HMACServiceLive),
)

const ServerLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiSwagger.layer()),
  Layer.provide(ApiLive),
  Layer.provide(NodeHttpServer.layer(() => createServer(), { port: 3000 })),
  Layer.provide(Services.AuthenticationService.AuthenticationServiceLive),
  Layer.provide(Services.AuthorizationService.AuthorizationServiceLive),
  Layer.provide(Services.FeatureFlagService.FeatureFlagServiceLive),
  Layer.provide(Services.FineGrainedAuthorizationService.FineGrainedAuthorizationServiceLive),
  Layer.provide(DPoPChain),
  Layer.provide(HomelabConfig.OIDCJWKConfigLocal.LocalOIDCJWKConfigLive),
  Layer.provide(HomelabConfig.OIDCConfigLocal.LocalOIDCEnvLayer),
  Layer.provide(HomelabConfig.ApiKeyConfig.ApiKeyConfigLive),
  Layer.provide(RemoteOIDCProviderURLMapLive),
  Layer.provide(Services.XmlPrintingProviderApplePlist.AppleMdmXmlPrintingLive),
  Layer.provide(Services.AcmeProfileGeneratorService.AcmeProfileServiceLive),
  Layer.provide(Services.WifiProfileGeneratorService.WifiProfileServiceLive),
  Layer.provide(Services.CertProfileGeneratorService.CertProfileServiceLive),
  Layer.provide(Services.RootPayloadService.RootPayloadServiceLive),
).pipe(
  Layer.provide(Services.AcmeConfigService.AcmeConfigServiceLive),
  Layer.provide(Services.WifiConfigService.WifiConfigServiceLive),
  Layer.provide(Services.CertConfigService.CertConfigServiceLive),
  Layer.provide(Services.UuidService.UuidServiceLive),
  Layer.provide(HomelabConfig.UUIDConfig.UuidDictionaryServiceLive),
  Layer.provide(Layer.succeed(HomelabConfig.AcmeConfig.AcmeConfigOptions, {
    acmeUrl: "https://ca.plato-splunk.media/acme/acme/directory",
    hardwareBound: true,
    keyType: "ECSECPrimeRandom",
    keySize: 384,
  })),
  Layer.provide(Services.XmlPrintingProviderApplePlist.AppleMdmXmlPrintingConfigDefault),
  Layer.provide(Services.CertificateService.CertificateServiceLive),
  Layer.provide(CertificateServiceConfigLayer),
  Layer.provide(NodeFileSystem.layer),
  Layer.provide(NodePath.layer),
  Layer.provide(FetchHttpClient.layer),
  Layer.provide(Layer.succeed(FetchHttpClient.Fetch, globalThis.fetch)),
)

NodeRuntime.runMain(
  Effect.tap(
    Layer.launch(ServerLive),
    () => Console.log("Listening on http://localhost:3000, docs at http://localhost:3000/docs"),
  ),
)
