import { NodeFileSystem, NodePath } from "@effect/platform-node"
import { ConfigProvider, Layer } from "effect"
import { Layers } from "homelab-services-node"
import {
  IntegrationTestLayer as ApiIntegrationTestLayer,
  TestIssuerJwkResolver,
} from "homelab-services-node/test-utils"
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
} from "homelab-services-node/test-utils"

export { buildProof, DPoPProofBuilderService, getPublicJWK } from "homelab-services-node/test-utils"

const privateDir = path.resolve(import.meta.dirname, "..", "private")
const certsDir = path.resolve(import.meta.dirname, "..", "..", "..", "certs")

const TestConfigProvider = Layer.setConfigProvider(
  ConfigProvider.fromMap(
    new Map([
      ["HOMELAB_ORIGIN_URL", "http://localhost:3000"],
      ["HOMELAB_SECRET_FILE", path.join(privateDir, "hmac-secret")],
      ["TOKEN_ISSUER_PRIVATE_KEY_PATH", path.join(privateDir, "jwk.json")],
      ["TOKEN_ISSUER_PRIVATE_KEY_SECRET_PATH", path.join(privateDir, "private-key-secret")],
      ["TOKEN_ISSUER_PUBLIC_KEY_PATH", path.join(privateDir, "jwk.pub.json")],
      ["API_KEYS_FILE", path.join(privateDir, "api-keys")],
      ["FEATURE_FLAGS", "*"],
      ["ROOT_CERT_DER", path.join(certsDir, "alford-root.der")],
      ["INTERMEDIATE_CERT_DER", path.join(certsDir, "intermediate_ca_2.der")],
      ["KANIDM_OPENID_PROVIDER_URL", "https://kanidm.test/oauth2/openid/test/.well-known/openid-configuration"],
    ]),
  ),
)

const TestEnvLive = EnvLive.pipe(Layer.provide(TestConfigProvider))

export const TestAuthenticationService = Layers.AuthenticationService.AuthenticationServiceLive.pipe(
  Layer.provide(TestIssuerJwkResolver),
)

export const TestAuthorizationService = Layers.AuthorizationService.AuthorizationServiceLive.pipe(
  Layer.provideMerge(Layers.FeatureFlagService.FeatureFlagServiceLive),
  Layer.provideMerge(Layers.FineGrainedAuthorizationService.FineGrainedAuthorizationServiceLive),
  Layer.provide(TestEnvLive),
)

const TestCertificateService = Layers.CertificateService.CertificateServiceLive.pipe(
  Layer.provide(NodeFileSystem.layer),
  Layer.provide(TestEnvLive),
)

const TestAcmeConfigService = Layers.AcmeConfigService.AcmeConfigServiceLive.pipe(
  Layer.provide(ProfileUuidConfigLive),
  Layer.provide(TestEnvLive),
)

const TestCertConfigService = Layers.CertConfigService.CertConfigServiceLive.pipe(
  Layer.provide(ProfileUuidConfigLive),
)

const TestXmlPrintingService = Layers.XmlPrintingAppleMdm.AppleMdmXmlPrintingLive.pipe(
  Layer.provide(Layers.XmlPrintingAppleMdm.AppleMdmXmlPrintingConfigDefault),
)

const TestRootPayloadService = Layers.RootPayloadService.RootPayloadServiceLive.pipe(
  Layer.provide(ProfileUuidConfigLive),
)

const TestWifiConfigService = Layers.WifiConfigService.WifiConfigServiceLive.pipe(
  Layer.provide(ProfileUuidConfigLive),
)

const TestWifiProfileGeneratorService = Layers.WifiProfileGeneratorService.WifiProfileServiceLive.pipe(
  Layer.provide(TestCertConfigService),
  Layer.provide(TestCertificateService),
  Layer.provide(TestRootPayloadService),
  Layer.provide(TestWifiConfigService),
)

const TestAcmeProfileGeneratorService = Layers.AcmeProfileGeneratorService.AcmeProfileServiceLive.pipe(
  Layer.provide(TestAcmeConfigService),
  Layer.provide(TestCertConfigService),
  Layer.provide(TestCertificateService),
  Layer.provide(TestRootPayloadService),
)

const TestCertProfileGeneratorService = Layers.CertProfileGeneratorService.CertProfileServiceLive.pipe(
  Layer.provide(TestCertConfigService),
  Layer.provide(TestCertificateService),
  Layer.provide(TestRootPayloadService),
)

export const TestUuidService = Layers.UuidService.UuidServiceLive

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
