import { HttpApiBuilder } from "@effect/platform"
import * as API from "homelab-api"

import { handleCerts } from "./certs.js"
import { handleDeviceAcme } from "./device-acme.js"
import { handleWifiGuest } from "./wifi-guest.js"
import { handleWifi } from "./wifi.js"

export const MobileConfigApiLive = HttpApiBuilder.group(
  API.Homelab.HomelabApi,
  "mobile-config",
  (handlers) =>
    handlers
      .handle("certs", handleCerts)
      .handle("wifi", handleWifi)
      .handle("device-acme", handleDeviceAcme)
      .handle("wifi-guest", handleWifiGuest),
)
