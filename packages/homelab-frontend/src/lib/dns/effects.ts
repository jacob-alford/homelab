import { HttpApiClient } from "@effect/platform"
import { Console, Effect, Option } from "effect"
import { Homelab } from "homelab-api"
import { $auth } from "../auth/index.js"
import { API_BASE_URL } from "../config.js"
import { $dnsParams, deriveProfile } from "./params.js"

function getEffective() {
  const params = $dnsParams.get()
  const tailscale = Option.getOrElse(params.tailscale, () => false)
  const blockAds = tailscale ? true : Option.getOrElse(params.blockAds, () => true)
  const keepLogs = Option.getOrElse(params.keepLogs, () => false)
  return { blockAds, tailscale, keepLogs }
}

export const downloadDnsProfile = Effect.fn("downloadDnsProfile")(function*() {
  const effective = getEffective()
  const profile = deriveProfile(effective)
  const auth = $auth.get()
  const token = Option.getOrUndefined(auth.token)

  const apiBaseUrl = yield* API_BASE_URL
  const client = yield* HttpApiClient.make(Homelab.HomelabApi, { baseUrl: apiBaseUrl })

  const result = yield* client["mobile-config"].dns({
    path: { profile },
    urlParams: {},
    ...token?.id_token ? { headers: { authorization: `Bearer ${token.id_token}` } } : { headers: {} },
  })

  yield* Effect.sync(() => {
    const blob = new Blob([result as unknown as string], { type: "application/x-apple-aspen-config" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `dns-${profile}.mobileconfig`
    a.click()
    URL.revokeObjectURL(url)
  })
}, Effect.tapError(Console.error))

export const copyDnsDownloadLink = Effect.fn("copyDnsDownloadLink")(function*() {
  const effective = getEffective()
  const profile = deriveProfile(effective)
  const apiBaseUrl = yield* API_BASE_URL

  const link = `${apiBaseUrl}/mobile-config/dns/${encodeURIComponent(profile)}/_download`

  yield* Effect.promise(() => navigator.clipboard.writeText(link))
}, Effect.tapError(Console.error))
