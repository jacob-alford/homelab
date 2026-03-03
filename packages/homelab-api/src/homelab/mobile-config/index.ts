import { HttpApiGroup } from "@effect/platform"
import * as AcmeDownload from "./acme-download.js"
import * as Acme from "./acme.js"
import * as Certs from "./certs.js"
import * as WifiDownload from "./wifi-download.js"
import * as Wifi from "./wifi.js"

export const MobileConfigApi = HttpApiGroup.make("mobile-config")
  .add(Acme.AcmeMobileConfig)
  .add(AcmeDownload.AcmeDownloadMobileConfig)
  .add(Certs.Certs)
  .add(Wifi.WifiMobileConfig)
  .add(WifiDownload.WifiMobileConfigDownload)
  .prefix("/mobile-config")

export * as AcmeDownload from "./acme-download.js"
export * as Acme from "./acme.js"
export * as Certs from "./certs.js"
export * as WifiDownload from "./wifi-download.js"
export * as Wifi from "./wifi.js"
