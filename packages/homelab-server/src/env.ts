import { Config, Layer, Schema } from "effect"
import { Config as HomelabConfig, Schemas } from "homelab-services"

export const EnvLive = Layer.effect(
  HomelabConfig.Env.Env,
  Config.all({
    originUrl: Schema.Config("HOMELAB_ORIGIN_URL", Schema.URL),
    tokenIssuerPrivateKeyPath: Config.string("TOKEN_ISSUER_PRIVATE_KEY_PATH"),
    hmacSecretFilePath: Config.string("HOMELAB_SECRET_FILE"),
    featureFlags: Schema.Config("FEATURE_FLAGS", Schemas.FeatureFlags.FeatureFlagsSetSchema),
    kanidmOidcUrl: Schema.Config("KANIDM_OPENID_PROVIDER_URL", Schema.URL),
    caUrl: Config.withDefault(Schema.Config("CA_URL", Schema.URL), new URL("https://ca.plato-splunk.media")),
    acmeDirectoryPath: Config.withDefault(Config.string("ACME_DIRECTORY_PATH"), "/acme/acme/directory"),
    hardwareBound: Config.withDefault(Config.boolean("ACME_HARDWARE_BOUND"), true),
    keyType: Config.withDefault(Config.string("ACME_KEY_TYPE"), "ECSECPrimeRandom"),
    keySize: Config.withDefault(Config.integer("ACME_KEY_SIZE"), 384),
    apiKeysFilePath: Config.string("API_KEYS_FILE"),
    rootCertDerPath: Config.string("ROOT_CERT_DER"),
    intermediateCertDerPath: Config.string("INTERMEDIATE_CERT_DER"),
  }),
)
