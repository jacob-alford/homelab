import { HttpApiClient } from "@effect/platform"
import { Effect } from "effect"
import { Homelab } from "homelab-api"
import { $token } from "../auth/index.js"
import { API_BASE_URL } from "../config.js"
import { getUsernameFromToken } from "./token-utils.js"

export const downloadAppleProfile = Effect.fn("downloadAppleProfile")(function*(
  ssid: string,
  encryption: "WPA2" | "WPA3",
  password: string,
  usernameOverride?: string,
) {
  const token = $token.get()
  if (!token?.id_token) return yield* Effect.fail(new Error("Not authenticated"))

  const username = usernameOverride || getUsernameFromToken()

  const apiBaseUrl = yield* API_BASE_URL
  const client = yield* HttpApiClient.make(Homelab.HomelabApi, { baseUrl: apiBaseUrl })

  const result = yield* client["mobile-config"].wifi({
    path: { ssid, encryption },
    payload: {
      username: username || undefined,
      password,
      disableMACRandomization: false,
      enterpriseClientType: "PEAP",
    },
    headers: { authorization: `Bearer ${token.id_token}` },
  })

  yield* Effect.sync(() => {
    const blob = new Blob([result as unknown as string], { type: "application/x-apple-aspen-config" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${ssid}.mobileconfig`
    a.click()
    URL.revokeObjectURL(url)
  })
})

export const fetchClaimCheckAndCopyLink = Effect.fn("fetchClaimCheckAndCopyLink")(function*(
  ssid: string,
  encryption: "WPA2" | "WPA3",
  password: string,
  usernameOverride?: string,
) {
  const token = $token.get()
  if (!token?.id_token) return yield* Effect.fail(new Error("Not authenticated"))

  const username = usernameOverride || getUsernameFromToken()

  const apiBaseUrl = yield* API_BASE_URL
  const client = yield* HttpApiClient.make(Homelab.HomelabApi, { baseUrl: apiBaseUrl })

  const { claim_check } = yield* client.oauth["claim-check"]({
    headers: { authorization: `Bearer ${token.id_token}` },
  })

  const link = `${apiBaseUrl}/mobile-config/wifi/${encodeURIComponent(ssid)}/${encryption}/_download?claim_check=${
    encodeURIComponent(claim_check)
  }&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&enterpriseClientType=PEAP`

  yield* Effect.promise(() => navigator.clipboard.writeText(link))
})

export const downloadCert = Effect.gen(function*() {
  const apiBaseUrl = yield* API_BASE_URL
  yield* Effect.sync(() => {
    window.location.href = `${apiBaseUrl}/mobile-config/certs/_download`
  })
})
