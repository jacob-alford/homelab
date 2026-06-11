import { HttpApiClient } from "@effect/platform"
import { Console, Effect, Option } from "effect"
import { Homelab } from "homelab-api"
import { API_BASE_URL } from "../env.js"
import { fromOption, MissingParamError } from "../util.js"

export const downloadAppleProfile = Effect.fn("downloadAppleProfile")(
  function*(args: {
    ssid: Option.Option<string>
    encryption: Option.Option<"WPA2" | "WPA3">
    password: Option.Option<string>
    username: Option.Option<string>
    disableMACRandomization: Option.Option<boolean>
    token: Option.Option<string>
  }) {
    const ssid = yield* fromOption(args.ssid, () => new MissingParamError({ param: "SSID" }))
    const password = yield* fromOption(args.password, () => new MissingParamError({ param: "Password" }))
    const encryption = Option.getOrElse(args.encryption, () => "WPA3" as const)
    const disableMACRandomization = Option.getOrElse(args.disableMACRandomization, () => false)
    const username = Option.getOrUndefined(args.username)
    const token = Option.getOrUndefined(args.token)

    if (username && username !== "guest" && !token) {
      return yield* Effect.fail(new MissingParamError({ param: "Authentication token" }))
    }

    const apiBaseUrl = yield* API_BASE_URL
    const client = yield* HttpApiClient.make(Homelab.HomelabApi, { baseUrl: apiBaseUrl })

    const payload: Homelab.MobileConfigEndpoints.Wifi.WifiMobileConfigParams = username
      ? { username, password, disableMACRandomization, enterpriseClientType: "PEAP" as const }
      : { password, disableMACRandomization, enterpriseClientType: "None" as const }

    const result = yield* client["mobile-config"].wifi({
      path: { ssid, encryption },
      payload: payload as any,
      urlParams: {},
      headers: token ? { authorization: `Bearer ${token}` } : {},
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
  },
  Effect.tapError(Console.error),
)

export const fetchClaimCheckAndCopyLink = Effect.fn("fetchClaimCheckAndCopyLink")(
  function*(args: {
    ssid: Option.Option<string>
    encryption: Option.Option<"WPA2" | "WPA3">
    password: Option.Option<string>
    username: Option.Option<string>
    disableMACRandomization: Option.Option<boolean>
    token: Option.Option<string>
  }) {
    const token = yield* fromOption(args.token, () => new MissingParamError({ param: "Authentication token" }))
    const ssid = yield* fromOption(args.ssid, () => new MissingParamError({ param: "SSID" }))
    const password = yield* fromOption(args.password, () => new MissingParamError({ param: "Password" }))
    const encryption = Option.getOrElse(args.encryption, () => "WPA3" as const)
    const username = Option.getOrUndefined(args.username)
    const disableMACRandomization = Option.getOrElse(args.disableMACRandomization, () => false)

    const apiBaseUrl = yield* API_BASE_URL
    const client = yield* HttpApiClient.make(Homelab.HomelabApi, { baseUrl: apiBaseUrl })

    const { claim_check } = yield* client.oauth["claim-check"]({
      headers: { authorization: `Bearer ${token}` },
    })

    const linkParams = new URLSearchParams({ claim_check, password })

    if (username) {
      linkParams.set("username", username)
      linkParams.set("enterpriseClientType", "PEAP")
    }

    if (disableMACRandomization) {
      linkParams.set("disableMACRandomization", "true")
    }

    const link = `${apiBaseUrl}/mobile-config/wifi/${
      encodeURIComponent(ssid)
    }/${encryption}/_download?${linkParams.toString()}`

    yield* Effect.promise(() => navigator.clipboard.writeText(link))
  },
  Effect.tapError(Console.error),
)

export const downloadCert = Effect.gen(function*() {
  const apiBaseUrl = yield* API_BASE_URL
  yield* Effect.sync(() => {
    window.location.href = `${apiBaseUrl}/cert/root/der`
  })
})

export const downloadIntermediateCert = Effect.gen(function*() {
  const apiBaseUrl = yield* API_BASE_URL
  yield* Effect.sync(() => {
    window.location.href = `${apiBaseUrl}/cert/intermediate/der`
  })
})

export const downloadCombinedCert = Effect.gen(function*() {
  const apiBaseUrl = yield* API_BASE_URL
  yield* Effect.sync(() => {
    window.location.href = `${apiBaseUrl}/cert/combined`
  })
})
