import { Layer } from "effect"
import { AcmeConfigServiceLive } from "../services/acme-config-service/layer.js"
import { AcmeProfileServiceLive } from "../services/acme-profile-generator/layer.js"
import { CertConfigServiceLive } from "../services/cert-config-service/layer.js"
import { CertProfileServiceLive } from "../services/cert-profile-generator/layer.js"
import { CertificateServiceLive } from "../services/certificate-service/layer.js"
import { RootPayloadServiceLive } from "../services/root-payload-service/layer.js"
import { WifiConfigServiceLive } from "../services/wifi-config-service/layer.js"
import { WifiProfileServiceLive } from "../services/wifi-profile-generator/layer.js"
import {
  AppleMdmXmlPrintingConfigDefault,
  AppleMdmXmlPrintingLive,
} from "../services/xml-printing-provider-apple-mdm/layer.js"

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
