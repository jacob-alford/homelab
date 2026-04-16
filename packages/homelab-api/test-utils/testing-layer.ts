import { NodeFileSystem } from "@effect/platform-node"
import { Config, ConfigProvider, Effect, HashSet, Layer, Schema } from "effect"
import * as path from "node:path"
import { ApiKeyConfigLive } from "../src/config/api-key-config.js"
import { Env } from "../src/config/env.js"
import { IssuerJwkResolverLive } from "../src/config/issuer-jwk-resolver-jose.js"
import { RemoteOIDCWellKnownDetailsService } from "../src/config/oidc-config-remote.js"
import type { FeatureFlagsSet } from "../src/schemas/feature-flags.js"
import { FeatureFlagsSetSchema } from "../src/schemas/feature-flags.js"
import { DPoPTokenValidatorServiceLive } from "../src/services/dpop-token-validator-service/index.js"
import { HMACServiceLive } from "../src/services/hmac-service/index.js"
import { NonceServiceLive } from "../src/services/nonce-service/index.js"
import { DPoPProofBuilderServiceLive } from "./dpop.js"

const privateDir = path.resolve(import.meta.dirname, "..", "private")

const TestConfigProvider = Layer.setConfigProvider(
  ConfigProvider.fromMap(
    new Map([
      ["HOMELAB_ORIGIN_URL", "http://localhost:3000"],
      ["TOKEN_ISSUER_PRIVATE_KEY_PATH", path.join(privateDir, "jwk.json")],
      ["HOMELAB_SECRET_FILE", path.join(privateDir, "hmac-secret")],
      ["API_KEYS_FILE", path.join(privateDir, "api-keys")],
      ["FEATURE_FLAGS", "*"],
      ["ROOT_CERT_DER", path.join(privateDir, "root.crt")],
      ["INTERMEDIATE_CERT_DER", path.join(privateDir, "intermediate.crt")],
      ["KANIDM_OIDC_URL", "https://kanidm.test/oauth2/openid/test/.well-known/openid-configuration"],
    ]),
  ),
)

const TestEnvLive = Layer.effect(
  Env,
  Effect.gen(function*() {
    const originUrl = yield* Schema.Config("HOMELAB_ORIGIN_URL", Schema.URL)
    const tokenIssuerPrivateKeyPath = yield* Config.string("TOKEN_ISSUER_PRIVATE_KEY_PATH")
    const hmacSecretFilePath = yield* Config.string("HOMELAB_SECRET_FILE")
    const featureFlags = yield* Schema.Config("FEATURE_FLAGS", FeatureFlagsSetSchema)
    const kanidmOidcUrl = yield* Schema.Config("KANIDM_OIDC_URL", Schema.URL)
    const caUrl = yield* Config.withDefault(
      Schema.Config("CA_URL", Schema.URL),
      new URL("https://ca.plato-splunk.media"),
    )
    const acmeDirectoryPath = yield* Config.withDefault(Config.string("ACME_DIRECTORY_PATH"), "/acme/acme/directory")
    const hardwareBound = yield* Config.withDefault(Config.boolean("ACME_HARDWARE_BOUND"), true)
    const keyType = yield* Config.withDefault(Config.string("ACME_KEY_TYPE"), "ECSECPrimeRandom")
    const keySize = yield* Config.withDefault(Config.integer("ACME_KEY_SIZE"), 384)
    const apiKeysFilePath = yield* Config.string("API_KEYS_FILE")
    const rootCertDerPath = yield* Config.string("ROOT_CERT_DER")
    const intermediateCertDerPath = yield* Config.string("INTERMEDIATE_CERT_DER")
    return {
      originUrl,
      tokenIssuerPrivateKeyPath,
      hmacSecretFilePath,
      featureFlags,
      kanidmOidcUrl,
      caUrl,
      acmeDirectoryPath,
      hardwareBound,
      keyType,
      keySize,
      apiKeysFilePath,
      rootCertDerPath,
      intermediateCertDerPath,
    }
  }),
).pipe(Layer.provide(TestConfigProvider))

export const makeTestEnvWithFlags = (featureFlags: FeatureFlagsSet): Layer.Layer<Env> =>
  Layer.succeed(Env, {
    originUrl: new URL("http://localhost:3000"),
    tokenIssuerPrivateKeyPath: path.join(privateDir, "jwk.json"),
    hmacSecretFilePath: path.join(privateDir, "hmac-secret"),
    featureFlags,
    kanidmOidcUrl: new URL("https://kanidm.test/oauth2/openid/test/.well-known/openid-configuration"),
    caUrl: new URL("https://ca.plato-splunk.media"),
    acmeDirectoryPath: "/acme/acme/directory",
    hardwareBound: true,
    keyType: "ECSECPrimeRandom",
    keySize: 384,
    apiKeysFilePath: path.join(privateDir, "api-keys"),
    rootCertDerPath: path.join(privateDir, "root.crt"),
    intermediateCertDerPath: path.join(privateDir, "intermediate.crt"),
  })

const TestRemoteOIDCWellKnownDetails = Layer.succeed(RemoteOIDCWellKnownDetailsService, {
  kanidm: {
    issuer: "https://kanidm.test/oauth2/openid/test",
    authorizationEndpoint: "https://kanidm.test/ui/oauth2",
    tokenEndpoint: "https://kanidm.test/oauth2/token",
    userInfoEndpoint: "https://kanidm.test/oauth2/openid/test/userinfo",
    jwksUri: new URL("https://kanidm.test/oauth2/openid/test/public_key.jwk"),
    revocationEndpoint: new URL("https://kanidm.test/oauth2/revoke"),
    introspectionEndpoint: new URL("https://kanidm.test/oauth2/introspect"),
  },
})

export const TestIssuerJwkResolver = IssuerJwkResolverLive.pipe(
  Layer.provide(TestRemoteOIDCWellKnownDetails),
  Layer.provide(TestEnvLive),
  Layer.provide(NodeFileSystem.layer),
)

export const TestHMACService = HMACServiceLive.pipe(
  Layer.provide(TestEnvLive),
  Layer.provide(NodeFileSystem.layer),
)

export const TestNonceService = NonceServiceLive.pipe(
  Layer.provideMerge(TestHMACService),
)

export const TestDPoPTokenValidatorService = DPoPTokenValidatorServiceLive.pipe(
  Layer.provideMerge(TestNonceService),
)

export const TestApiKeyConfig = ApiKeyConfigLive.pipe(
  Layer.provide(NodeFileSystem.layer),
  Layer.provide(TestConfigProvider),
)

export const TestDPoPProofBuilderService = DPoPProofBuilderServiceLive

export const IntegrationTestLayer = Layer.mergeAll(
  TestIssuerJwkResolver,
  TestHMACService,
  TestNonceService,
  TestDPoPTokenValidatorService,
  TestApiKeyConfig,
  TestDPoPProofBuilderService,
  NodeFileSystem.layer,
)
