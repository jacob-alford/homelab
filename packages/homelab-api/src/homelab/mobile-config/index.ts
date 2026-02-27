import { HttpApiGroup } from "@effect/platform"
import * as Certs from "./certs.js"
import * as DeviceAcme from "./device-acme.js"
import * as WifiDownload from "./wifi-download.js"
import * as Wifi from "./wifi.js"

export const MobileConfigApi = HttpApiGroup.make("mobile-config")
  .add(Certs.Certs)
  .add(Wifi.WifiMobileConfig)
  .add(WifiDownload.WifiMobileConfigDownload)
  .add(DeviceAcme.DeviceAcme)
  .prefix("/mobile-config")

export * as Certs from "./certs.js"
export * as DeviceAcme from "./device-acme.js"
export * as WifiDownload from "./wifi-download.js"
export * as Wifi from "./wifi.js"
