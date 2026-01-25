import { HttpApiGroup } from "@effect/platform"
import { Certs } from "./certs.js"
import { DeviceAcme } from "./device-acme.js"
import { Wifi } from "./wifi.js"
import { WifiGuest } from "./wifi-guest.js"

export const MobileConfigApi = HttpApiGroup.make("mobile-config")
  .add(Certs)
  .add(Wifi)
  .add(DeviceAcme)
  .add(WifiGuest)
  .prefix("/mobile-config")
