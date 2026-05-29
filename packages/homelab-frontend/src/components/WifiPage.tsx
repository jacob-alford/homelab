import { FetchHttpClient, HttpApiClient, type HttpClient } from "@effect/platform"
import { useStore } from "@nanostores/solid"
import { Effect, Layer } from "effect"
import { Homelab } from "homelab-api"
import { createSignal, onMount } from "solid-js"
import { $token, login } from "../lib/auth/index.js"
import { AstroConfigProvider } from "../lib/config-provider.js"
import { API_BASE_URL } from "../lib/config.js"
import { SessionStorageServiceLive, type StorageService } from "../lib/storage/index.js"
import { showErrorToast, showSuccessToast } from "./Toast.js"
import { WifiPageView } from "./WifiPageView.js"

const RuntimeLayer = Layer.mergeAll(FetchHttpClient.layer, SessionStorageServiceLive)

type AppRequirements = HttpClient.HttpClient | StorageService

const runEffect = <A, E>(effect: Effect.Effect<A, E, AppRequirements>) =>
  Effect.runPromise(
    effect.pipe(
      Effect.provide(RuntimeLayer),
      Effect.withConfigProvider(AstroConfigProvider),
    ),
  )

function decodeIdTokenPayload(idToken: string): Record<string, unknown> | null {
  try {
    return JSON.parse(atob(idToken.split(".")[1]))
  } catch {
    return null
  }
}

function getQueryParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    ssid: params.get("ssid") ?? "",
    encryption: (params.get("encryption") as "WPA2" | "WPA3") ?? "WPA2",
    password: params.get("password") ?? "",
  }
}

function handleLogin() {
  runEffect(login()).catch((err) => {
    showErrorToast(err instanceof Error ? err.message : "Login failed")
  })
}

function handleLogout() {
  $token.set(null)
}

const handleDownloadAppleProfile = Effect.fn("handleDownloadAppleProfile")(function*(
  ssid: string,
  encryption: "WPA2" | "WPA3",
  password: string,
) {
  const token = $token.get()
  if (!token?.id_token) return yield* Effect.fail(new Error("Not authenticated"))

  const payload = decodeIdTokenPayload(token.id_token)
  const username = (payload?.preferred_username ?? payload?.name ?? "") as string

  const apiBaseUrl = yield* API_BASE_URL
  const client = yield* HttpApiClient.make(Homelab.HomelabApi, { baseUrl: apiBaseUrl })

  const result = yield* client["mobile-config"].wifi({
    path: { ssid, encryption },
    payload: { username: username || undefined, password, disableMACRandomization: false },
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

const fetchClaimCheckAndCopyLink = Effect.fn("fetchClaimCheckAndCopyLink")(function*(
  ssid: string,
  encryption: "WPA2" | "WPA3",
) {
  const token = $token.get()
  if (!token?.id_token) return yield* Effect.fail(new Error("Not authenticated"))

  const payload = decodeIdTokenPayload(token.id_token)
  const username = (payload?.preferred_username ?? payload?.name ?? "") as string

  const apiBaseUrl = yield* API_BASE_URL
  const client = yield* HttpApiClient.make(Homelab.HomelabApi, { baseUrl: apiBaseUrl })

  const { claim_check } = yield* client.oauth["claim-check"]({
    headers: { authorization: `Bearer ${token.id_token}` },
  })

  const link = `${apiBaseUrl}/mobile-config/wifi/${encodeURIComponent(ssid)}/${encryption}/_download?claim_check=${
    encodeURIComponent(claim_check)
  }&username=${encodeURIComponent(username)}`

  yield* Effect.promise(() => navigator.clipboard.writeText(link))
})

export function WifiPage() {
  const token = useStore($token)
  const [params, setParams] = createSignal({ ssid: "", encryption: "WPA2" as "WPA2" | "WPA3", password: "" })
  const [mounted, setMounted] = createSignal(false)
  const [copyingLink, setCopyingLink] = createSignal(false)

  const isAuthenticated = () => token() !== null
  const displayName = () => {
    const t = token()
    if (!t?.id_token) return null
    const payload = decodeIdTokenPayload(t.id_token)
    return (payload?.name ?? payload?.preferred_username ?? null) as string | null
  }

  onMount(() => {
    setParams(getQueryParams())
    setMounted(true)
  })

  function handleDownload() {
    const p = params()
    runEffect(handleDownloadAppleProfile(p.ssid, p.encryption, p.password)).catch((err) => {
      showErrorToast(err instanceof Error ? err.message : "Failed to download wifi profile")
    })
  }

  function handleCopyDownloadLink() {
    const p = params()
    setCopyingLink(true)
    runEffect(fetchClaimCheckAndCopyLink(p.ssid, p.encryption))
      .then(() => showSuccessToast("Download link copied to clipboard"))
      .catch((err) => showErrorToast(err instanceof Error ? err.message : "Failed to copy link"))
      .finally(() => setCopyingLink(false))
  }

  function handleDownloadCert() {
    runEffect(Effect.gen(function*() {
      const apiBaseUrl = yield* API_BASE_URL
      yield* Effect.sync(() => {
        window.location.href = `${apiBaseUrl}/mobile-config/certs/_download`
      })
    })).catch((err) => {
      showErrorToast(err instanceof Error ? err.message : "Failed to download cert")
    })
  }

  function handleCopyPassword() {
    navigator.clipboard.writeText(params().password)
  }

  return (
    <WifiPageView
      mounted={mounted()}
      ssid={params().ssid}
      encryption={params().encryption}
      password={params().password}
      isAuthenticated={isAuthenticated()}
      displayName={displayName()}
      copyingLink={copyingLink()}
      onLogin={handleLogin}
      onLogout={handleLogout}
      onDownloadAppleProfile={handleDownload}
      onDownloadCert={handleDownloadCert}
      onCopyDownloadLink={handleCopyDownloadLink}
      onCopyPassword={handleCopyPassword}
    />
  )
}
