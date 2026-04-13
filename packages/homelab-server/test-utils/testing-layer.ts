import { NodeFileSystem, NodePath } from "@effect/platform-node"
import { ConfigProvider, Layer } from "effect"
import { Config, Services } from "homelab-api"
import { Constants } from "homelab-shared"
import * as path from "node:path"
import { DPoPProofBuilderServiceLive } from "./dpop.js"

const privateDir = path.resolve(import.meta.dirname, "..", "private")
const certsDir = path.resolve(import.meta.dirname, "..", "..", "..", "certs")

const TestConfigProvider = Layer.setConfigProvider(
  ConfigProvider.fromMap(
    new Map([
      ["HOMELAB_JWK_PRIVATE_KEY_PATH", path.join(privateDir, "jwk.json")],
      ["HOMELAB_SECRET_FILE", path.join(privateDir, "hmac-secret")],
      ["API_KEYS_FILE", path.join(privateDir, "api-keys")],
      ["FEATURE_FLAGS", "*"],
    ]),
  ),
)

const TestOIDCIssuerResolver = Layer.succeed(
  Config.OIDCIssuerResolver.OIDCIssuerResolver,
  {
    kanidm: "https://kanidm.test/oauth2/openid/test",
    homelab: Constants.JWT_HOMELAB_API_ISSUER,
    testing: Constants.JWT_HOMELAB_API_TESTING_ISSUER,
  },
)

export const TestLocalOIDCJWKConfig = Config.OIDCJWKConfigLocal.LocalOIDCJWKConfigLive.pipe(
  Layer.provide(Config.OIDCConfigLocal.LocalOIDCEnvLayer),
  Layer.provide(TestOIDCIssuerResolver),
  Layer.provide(NodeFileSystem.layer),
  Layer.provide(TestConfigProvider),
)

export const TestHMACService = Services.HMACService.HMACServiceLive.pipe(
  Layer.provide(NodeFileSystem.layer),
  Layer.provide(TestConfigProvider),
)

export const TestNonceService = Services.NonceService.NonceServiceLive.pipe(
  Layer.provideMerge(TestHMACService),
)

export const TestDPoPTokenValidatorService = Services.DPoPTokenValidatorService.DPoPTokenValidatorServiceLive.pipe(
  Layer.provideMerge(TestNonceService),
)

export const TestApiKeyConfig = Config.ApiKeyConfig.ApiKeyConfigLive.pipe(
  Layer.provide(NodeFileSystem.layer),
  Layer.provide(TestConfigProvider),
)

export const TestAuthenticationService = Services.AuthenticationService.AuthenticationServiceLive.pipe(
  Layer.provide(TestLocalOIDCJWKConfig),
)

export const TestAuthorizationService = Services.AuthorizationService.AuthorizationServiceLive.pipe(
  Layer.provideMerge(Services.FeatureFlagService.FeatureFlagServiceLive),
  Layer.provideMerge(Services.FineGrainedAuthorizationService.FineGrainedAuthorizationServiceLive),
  Layer.provide(TestConfigProvider),
)

export const TestDPoPProofBuilderService = DPoPProofBuilderServiceLive

const TestCertificateServiceConfig = Layer.succeed(
  Services.CertificateService.CertificateServiceConfig,
  {
    rootCert: path.join(certsDir, "alford-root.crt"),
    intermediateCert: path.join(certsDir, "intermediate_ca_2.crt"),
  },
)

const TestCertificateService = Services.CertificateService.CertificateServiceLive.pipe(
  Layer.provide(NodeFileSystem.layer),
  Layer.provide(TestCertificateServiceConfig),
)

const TestAcmeConfigOptions = Layer.succeed(
  Config.AcmeConfig.AcmeConfigOptions,
  {
    acmeUrl: "https://ca.test/acme/acme/directory",
    hardwareBound: true,
    keyType: "ECSECPrimeRandom",
    keySize: 384,
  },
)

const TestUuidDictionaryService = Config.UUIDConfig.UuidDictionaryServiceLive

const TestXmlPrintingService = Services.XmlPrintingProviderApplePlist.AppleMdmXmlPrintingLive.pipe(
  Layer.provide(Services.XmlPrintingProviderApplePlist.AppleMdmXmlPrintingConfigDefault),
)

const TestRootPayloadService = Services.RootPayloadService.RootPayloadServiceLive.pipe(
  Layer.provide(TestUuidDictionaryService),
)

const TestWifiConfigService = Services.WifiConfigService.WifiConfigServiceLive.pipe(
  Layer.provide(TestUuidDictionaryService),
)

const TestAcmeConfigService = Services.AcmeConfigService.AcmeConfigServiceLive.pipe(
  Layer.provide(TestUuidDictionaryService),
  Layer.provide(TestAcmeConfigOptions),
)

const TestCertConfigService = Services.CertConfigService.CertConfigServiceLive.pipe(
  Layer.provide(TestUuidDictionaryService),
)

const TestWifiProfileGeneratorService = Services.WifiProfileGeneratorService.WifiProfileServiceLive.pipe(
  Layer.provide(TestCertConfigService),
  Layer.provide(TestCertificateService),
  Layer.provide(TestRootPayloadService),
  Layer.provide(TestWifiConfigService),
)

const TestAcmeProfileGeneratorService = Services.AcmeProfileGeneratorService.AcmeProfileServiceLive.pipe(
  Layer.provide(TestAcmeConfigService),
  Layer.provide(TestCertConfigService),
  Layer.provide(TestCertificateService),
  Layer.provide(TestRootPayloadService),
)

const TestCertProfileGeneratorService = Services.CertProfileGeneratorService.CertProfileServiceLive.pipe(
  Layer.provide(TestCertConfigService),
  Layer.provide(TestCertificateService),
  Layer.provide(TestRootPayloadService),
)

export const TestUuidService = Services.UuidService.UuidServiceLive

export const HandlerTestLayer = Layer.mergeAll(
  TestAuthorizationService,
  TestXmlPrintingService,
  TestWifiProfileGeneratorService,
  TestAcmeProfileGeneratorService,
  TestCertProfileGeneratorService,
  TestUuidService,
  NodeFileSystem.layer,
  NodePath.layer,
)

export const IntegrationTestLayer = Layer.mergeAll(
  TestLocalOIDCJWKConfig,
  TestHMACService,
  TestNonceService,
  TestDPoPTokenValidatorService,
  TestApiKeyConfig,
  TestAuthenticationService,
  TestAuthorizationService,
  TestDPoPProofBuilderService,
  NodeFileSystem.layer,
)
