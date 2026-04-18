import { NodeFileSystem, NodePath } from "@effect/platform-node"
import { ConfigProvider, Layer } from "effect"
import { Services } from "homelab-api"
import {
  IntegrationTestLayer as ApiIntegrationTestLayer,
  TestApiKeyConfig,
  TestDPoPProofBuilderService,
  TestDPoPTokenValidatorService,
  TestHMACService,
  TestIssuerJwkResolver,
  TestNonceService,
} from "homelab-api/test-utils"
import * as path from "node:path"
import { EnvLive } from "../src/env.js"
import { ProfileUuidConfigLive } from "../src/uuids.js"

export {
  TestApiKeyConfig,
  TestDPoPProofBuilderService,
  TestDPoPTokenValidatorService,
  TestHMACService,
  TestIssuerJwkResolver,
  TestNonceService,
} from "homelab-api/test-utils"

export { buildProof, DPoPProofBuilderService, getPublicJWK } from "homelab-api/test-utils"

const privateDir = path.resolve(import.meta.dirname, "..", "private")
const certsDir = path.resolve(import.meta.dirname, "..", "..", "..", "certs")

const TestConfigProvider = Layer.setConfigProvider(
  ConfigProvider.fromMap(
    new Map([
      ["HOMELAB_ORIGIN_URL", "http://localhost:3000"],
      ["TOKEN_ISSUER_PRIVATE_KEY_PATH", path.join(privateDir, "jwk.json")],
      ["HOMELAB_SECRET_FILE", path.join(privateDir, "hmac-secret")],
      ["API_KEYS_FILE", path.join(privateDir, "api-keys")],
      ["FEATURE_FLAGS", "*"],
      ["ROOT_CERT_DER", path.join(certsDir, "alford-root.crt")],
      ["INTERMEDIATE_CERT_DER", path.join(certsDir, "intermediate_ca_2.crt")],
      ["KANIDM_OIDC_URL", "https://kanidm.test/oauth2/openid/test/.well-known/openid-configuration"],
    ]),
  ),
)

const TestEnvLive = EnvLive.pipe(Layer.provide(TestConfigProvider))

export const TestAuthenticationService = Services.AuthenticationService.AuthenticationServiceLive.pipe(
  Layer.provide(TestIssuerJwkResolver),
)

export const TestAuthorizationService = Services.AuthorizationService.AuthorizationServiceLive.pipe(
  Layer.provideMerge(Services.FeatureFlagService.FeatureFlagServiceLive),
  Layer.provideMerge(Services.FineGrainedAuthorizationService.FineGrainedAuthorizationServiceLive),
  Layer.provide(TestEnvLive),
)

const TestCertificateService = Services.CertificateService.CertificateServiceLive.pipe(
  Layer.provide(NodeFileSystem.layer),
  Layer.provide(TestEnvLive),
)

const TestAcmeConfigService = Services.AcmeConfigService.AcmeConfigServiceLive.pipe(
  Layer.provide(ProfileUuidConfigLive),
  Layer.provide(TestEnvLive),
)

const TestCertConfigService = Services.CertConfigService.CertConfigServiceLive.pipe(
  Layer.provide(ProfileUuidConfigLive),
)

const TestXmlPrintingService = Services.XmlPrintingProviderApplePlist.AppleMdmXmlPrintingLive.pipe(
  Layer.provide(Services.XmlPrintingProviderApplePlist.AppleMdmXmlPrintingConfigDefault),
)

const TestRootPayloadService = Services.RootPayloadService.RootPayloadServiceLive.pipe(
  Layer.provide(ProfileUuidConfigLive),
)

const TestWifiConfigService = Services.WifiConfigService.WifiConfigServiceLive.pipe(
  Layer.provide(ProfileUuidConfigLive),
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
  ApiIntegrationTestLayer,
  TestAuthenticationService,
  TestAuthorizationService,
)
