import { NodeFileSystem } from "@effect/platform-node"
import { ConfigProvider, Layer } from "effect"
import { Constants } from "homelab-shared"
import * as path from "node:path"
import { ApiKeyConfigLive } from "../src/config/api-key-config.js"
import { LocalOIDCEnvLayer } from "../src/config/oidc-config-local.js"
import { OIDCIssuerResolver } from "../src/config/oidc-issuer-resolver.js"
import { LocalOIDCJWKConfigLive } from "../src/config/oidc-jwk-config-local.js"
import { DPoPTokenValidatorServiceLive } from "../src/services/dpop-token-validator-service/index.js"
import { HMACServiceLive } from "../src/services/hmac-service/index.js"
import { NonceServiceLive } from "../src/services/nonce-service/index.js"
import { DPoPProofBuilderServiceLive } from "./dpop.js"

const privateDir = path.resolve(import.meta.dirname, "..", "private")

const TestConfigProvider = Layer.setConfigProvider(
  ConfigProvider.fromMap(
    new Map([
      ["HOMELAB_JWK_PRIVATE_KEY_PATH", path.join(privateDir, "jwk.json")],
      ["HOMELAB_SECRET_FILE", path.join(privateDir, "hmac-secret")],
      ["API_KEYS_FILE", path.join(privateDir, "api-keys")],
    ]),
  ),
)

const TestOIDCIssuerResolver = Layer.succeed(
  OIDCIssuerResolver,
  {
    kanidm: "https://kanidm.test/oauth2/openid/test",
    homelab: Constants.JWT_HOMELAB_API_ISSUER,
    testing: Constants.JWT_HOMELAB_API_TESTING_ISSUER,
  },
)

export const TestLocalOIDCJWKConfig = LocalOIDCJWKConfigLive.pipe(
  Layer.provide(LocalOIDCEnvLayer),
  Layer.provide(TestOIDCIssuerResolver),
  Layer.provide(NodeFileSystem.layer),
  Layer.provide(TestConfigProvider),
)

export const TestHMACService = HMACServiceLive.pipe(
  Layer.provide(NodeFileSystem.layer),
  Layer.provide(TestConfigProvider),
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
  TestLocalOIDCJWKConfig,
  TestHMACService,
  TestNonceService,
  TestDPoPTokenValidatorService,
  TestApiKeyConfig,
  TestDPoPProofBuilderService,
  NodeFileSystem.layer,
)
