import { HttpApiGroup } from "@effect/platform"
import * as Certs from "./certs.js"
import * as DeviceAcme from "./device-acme.js"
import * as WifiGuest from "./wifi-guest.js"
import * as Wifi from "./wifi.js"

export const MobileConfigApi = HttpApiGroup.make("mobile-config")
  .add(Certs.Certs)
  .add(Wifi.Wifi)
  .add(DeviceAcme.DeviceAcme)
  .add(WifiGuest.WifiGuest)
  .prefix("/mobile-config")

export { Certs, DeviceAcme, Wifi, WifiGuest }
