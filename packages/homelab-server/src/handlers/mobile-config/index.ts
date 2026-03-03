import { HttpApiBuilder } from "@effect/platform"
import { Homelab } from "homelab-api"

import { handleAcmeDownload } from "./acme-download.js"
import { handleAcme } from "./acme.js"
import { handleCerts } from "./certs.js"
import { handleWifiDownload } from "./wifi-download.js"
import { handleWifi } from "./wifi.js"

export const MobileConfigApiLive = HttpApiBuilder.group(
  Homelab.HomelabApi,
  "mobile-config",
  (handlers) =>
    handlers
      .handle("acme", handleAcme)
      .handle("acme-download", handleAcmeDownload)
      .handle("certs", handleCerts)
      .handle("wifi", handleWifi)
      .handle("wifi-download", handleWifiDownload),
)
