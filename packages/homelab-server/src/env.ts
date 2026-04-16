import { Config, Effect, Layer, Schema } from "effect"
import { Config as HomelabConfig, Schemas } from "homelab-api"

export const EnvLive = Layer.effect(
  HomelabConfig.Env.Env,
  Effect.gen(function*() {
    const originUrl = yield* Schema.Config("HOMELAB_ORIGIN_URL", Schema.URL)
    const tokenIssuerPrivateKeyPath = yield* Config.string("TOKEN_ISSUER_PRIVATE_KEY_PATH")
    const hmacSecretFilePath = yield* Config.string("HOMELAB_SECRET_FILE")
    const featureFlags = yield* Schema.Config("FEATURE_FLAGS", Schemas.FeatureFlags.FeatureFlagsSetSchema)
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
)
