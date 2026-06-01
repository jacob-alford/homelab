import { HttpApiClient } from "@effect/platform"
import { Effect, Option } from "effect"
import { Homelab } from "homelab-api"
import { $auth, $username } from "../auth/index.js"
import { API_BASE_URL } from "../config.js"
import { $wifiParams } from "./params.js"

export const downloadAppleProfile = Effect.fn("downloadAppleProfile")(function*() {
  const auth = $auth.get()
  const token = yield* auth.token
  if (!token.id_token) return yield* Effect.fail(new Error("Not authenticated"))

  const params = $wifiParams.get()
  const ssid = yield* params.ssid
  const password = yield* params.password
  const encryption = Option.getOrElse(params.encryption, () => "WPA3" as const)
  const username = Option.orElse(params.username, () => $username.get())

  const apiBaseUrl = yield* API_BASE_URL
  const client = yield* HttpApiClient.make(Homelab.HomelabApi, { baseUrl: apiBaseUrl })

  const result = yield* client["mobile-config"].wifi({
    path: { ssid, encryption },
    payload: {
      username: Option.getOrUndefined(username),
      password,
      disableMACRandomization: Option.getOrElse(params.disableMACRandomization, () => false),
      enterpriseClientType: Option.isSome(username)
        ? Option.getOrUndefined(params.enterpriseClientType)
        : undefined,
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

export const fetchClaimCheckAndCopyLink = Effect.fn("fetchClaimCheckAndCopyLink")(function*() {
  const auth = $auth.get()
  const token = yield* auth.token
  if (!token.id_token) return yield* Effect.fail(new Error("Not authenticated"))

  const params = $wifiParams.get()
  const ssid = yield* params.ssid
  const password = yield* params.password
  const encryption = Option.getOrElse(params.encryption, () => "WPA3" as const)
  const username = Option.orElse(params.username, () => $username.get())

  const apiBaseUrl = yield* API_BASE_URL
  const client = yield* HttpApiClient.make(Homelab.HomelabApi, { baseUrl: apiBaseUrl })

  const { claim_check } = yield* client.oauth["claim-check"]({
    headers: { authorization: `Bearer ${token.id_token}` },
  })

  const linkParams = new URLSearchParams({
    claim_check,
    password,
  })

  if (Option.isSome(username)) {
    linkParams.set("username", username.value)
    if (Option.isSome(params.enterpriseClientType)) {
      linkParams.set("enterpriseClientType", params.enterpriseClientType.value)
    }
  }

  const link = `${apiBaseUrl}/mobile-config/wifi/${
    encodeURIComponent(ssid)
  }/${encryption}/_download?${linkParams.toString()}`

  yield* Effect.promise(() => navigator.clipboard.writeText(link))
})

export const downloadCert = Effect.gen(function*() {
  const apiBaseUrl = yield* API_BASE_URL
  yield* Effect.sync(() => {
    window.location.href = `${apiBaseUrl}/mobile-config/certs/_download`
  })
})
