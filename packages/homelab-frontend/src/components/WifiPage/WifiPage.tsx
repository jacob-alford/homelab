import { useStore } from "@nanostores/solid"
import { createSignal, onMount } from "solid-js"
import { $token, login } from "../../lib/auth/index.js"
import {
  decodeIdTokenPayload,
  downloadAppleProfile,
  downloadCert,
  fetchClaimCheckAndCopyLink,
  getUsernameFromToken,
  runEffect,
} from "../../lib/wifi/index.js"
import { showErrorToast, showSuccessToast } from "../Toast/index.js"
import { WifiPageView } from "./WifiPageView.js"

function getQueryParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    ssid: params.get("ssid") ?? "",
    encryption: (params.get("encryption") as "WPA2" | "WPA3") ?? "WPA2",
    password: params.get("password") ?? "",
    username: params.get("username") ?? "",
  }
}

export function WifiPage() {
  const token = useStore($token)
  const [params, setParams] = createSignal({
    ssid: "",
    encryption: "WPA3" as "WPA2" | "WPA3",
    password: "",
    username: "",
  })
  const [mounted, setMounted] = createSignal(false)
  const [copyingLink, setCopyingLink] = createSignal(false)
  const [usernameOverride, setUsernameOverride] = createSignal("")
  const [passwordOverride, setPasswordOverride] = createSignal("")

  const isAuthenticated = () => token() !== null
  const displayName = () => {
    const t = token()
    if (!t?.id_token) return null
    const payload = decodeIdTokenPayload(t.id_token)
    return (payload?.name ?? payload?.preferred_username ?? null) as string | null
  }

  const effectivePassword = () => passwordOverride()
  const effectiveUsername = () => usernameOverride() || getUsernameFromToken()
  const canDownload = () => !!params().ssid && !!effectivePassword() && !!effectiveUsername()

  onMount(() => {
    const p = getQueryParams()
    setParams(p)
    setUsernameOverride(p.username)
    setPasswordOverride(p.password)
    setMounted(true)
  })

  function handleLogin() {
    runEffect(login()).catch((err) => {
      showErrorToast(err instanceof Error ? err.message : "Login failed")
    })
  }

  function handleLogout() {
    $token.set(null)
  }

  function validateFields(): boolean {
    if (!params().ssid) {
      showErrorToast("SSID is required")
      return false
    }
    if (!effectiveUsername()) {
      showErrorToast("Username is required")
      return false
    }
    if (!effectivePassword()) {
      showErrorToast("Password is required")
      return false
    }
    return true
  }

  function handleDownload() {
    if (!validateFields()) return
    const p = params()
    runEffect(
      downloadAppleProfile(
        p.ssid,
        p.encryption,
        effectivePassword(),
        usernameOverride() || undefined,
      ),
    ).catch((err) => {
      showErrorToast(err instanceof Error ? err.message : "Failed to download wifi profile")
    })
  }

  function handleCopyDownloadLink() {
    if (!validateFields()) return
    const p = params()
    setCopyingLink(true)
    runEffect(
      fetchClaimCheckAndCopyLink(
        p.ssid,
        p.encryption,
        effectivePassword(),
        usernameOverride() || undefined,
      ),
    )
      .then(() => showSuccessToast("Download link copied to clipboard"))
      .catch((err) => showErrorToast(err instanceof Error ? err.message : "Failed to copy link"))
      .finally(() => setCopyingLink(false))
  }

  function handleDownloadCert() {
    runEffect(downloadCert).catch((err) => {
      showErrorToast(err instanceof Error ? err.message : "Failed to download cert")
    })
  }

  function handleCopyUsername() {
    navigator.clipboard.writeText(effectiveUsername())
  }

  function handleCopyPassword() {
    navigator.clipboard.writeText(effectivePassword())
  }

  return (
    <WifiPageView
      mounted={mounted()}
      ssid={params().ssid}
      encryption={params().encryption}
      isAuthenticated={isAuthenticated()}
      displayName={displayName()}
      copyingLink={copyingLink()}
      canDownload={canDownload()}
      effectiveUsername={effectiveUsername()}
      usernameOverride={usernameOverride()}
      passwordOverride={passwordOverride()}
      onUsernameOverrideChange={setUsernameOverride}
      onPasswordOverrideChange={setPasswordOverride}
      onLogin={handleLogin}
      onLogout={handleLogout}
      onDownloadAppleProfile={handleDownload}
      onDownloadCert={handleDownloadCert}
      onCopyDownloadLink={handleCopyDownloadLink}
      onCopyUsername={handleCopyUsername}
      onCopyPassword={handleCopyPassword}
    />
  )
}
