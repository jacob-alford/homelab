import { Layer } from "effect"
import { AcmeConfigServiceLive } from "../layers/acme-config-service.js"
import { AcmeProfileServiceLive } from "../layers/acme-profile-generator.js"
import { CertConfigServiceLive } from "../layers/cert-config-service.js"
import { CertProfileServiceLive } from "../layers/cert-profile-generator.js"
import { CertificateServiceLive } from "../layers/certificate-service.js"
import { RootPayloadServiceLive } from "../layers/root-payload-service.js"
import { WifiConfigServiceLive } from "../layers/wifi-config-service.js"
import { WifiProfileServiceLive } from "../layers/wifi-profile-generator.js"
import { AppleMdmXmlPrintingConfigDefault, AppleMdmXmlPrintingLive } from "../layers/xml-printing-provider-apple-mdm.js"

const ServiceDeps = RootPayloadServiceLive.pipe(
  Layer.provideMerge(AcmeConfigServiceLive),
  Layer.provideMerge(WifiConfigServiceLive),
  Layer.provideMerge(CertConfigServiceLive),
  Layer.provideMerge(CertificateServiceLive),
)

export const Aggregate = Layer.merge(
  Layer.merge(AcmeProfileServiceLive, WifiProfileServiceLive),
  Layer.merge(
    CertProfileServiceLive,
    AppleMdmXmlPrintingLive.pipe(Layer.provide(AppleMdmXmlPrintingConfigDefault)),
  ),
).pipe(
  Layer.provide(ServiceDeps),
)
