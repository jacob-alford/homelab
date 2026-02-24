import { HttpApiBuilder } from "@effect/platform"
import { Homelab } from "homelab-api"

import { handleCerts } from "./certs.js"
import { handleDeviceAcme } from "./device-acme.js"
import { handleWifiDownload } from "./wifi-download.js"
import { handleWifi } from "./wifi.js"

export const MobileConfigApiLive = HttpApiBuilder.group(
  Homelab.HomelabApi,
  "mobile-config",
  (handlers) =>
    handlers
      .handle("certs", handleCerts)
      .handle("wifi", handleWifi)
      .handle("wifi-download", handleWifiDownload)
      .handle("device-acme", handleDeviceAcme),
)
