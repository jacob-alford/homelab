import { useStore } from "@nanostores/solid"
import { Option } from "effect"
import { createSignal, onMount, Show } from "solid-js"
import { $displayName, $isAuthenticated, $username, clearAuth, login, oidcEnabled } from "../../lib/auth/index.js"
import {
  $wifiParams,
  downloadAppleProfile,
  downloadCert,
  fetchClaimCheckAndCopyLink,
  runEffect,
} from "../../lib/wifi/index.js"
import { showErrorToast, showSuccessToast } from "../Toast/index.js"
import { WifiPageView } from "./WifiPageView.js"
import { WifiSetupView } from "./WifiSetupView.js"
import "./WifiPage.css"

export function WifiPage() {
  const isAuthenticated = useStore($isAuthenticated)
  const displayName = useStore($displayName)
  const username = useStore($username)
  const params = useStore($wifiParams)
  const [mounted, setMounted] = createSignal(false)
  const [copyingLink, setCopyingLink] = createSignal(false)

  const requiredParams = () => {
    const p = params()
    return Option.all({ ssid: p.ssid, encryption: p.encryption, password: p.password })
  }

  const [confirmed, setConfirmed] = createSignal(Option.isSome(requiredParams()))

  const effectiveUsername = () => Option.orElse(params().username, () => username())

  const canDownload = () => Option.isSome(params().password)

  const canConfirmSetup = () =>
    Option.isSome(params().ssid)
    && Option.isSome(params().encryption)
    && Option.isSome(params().password)

  onMount(() => setMounted(true))

  function handleLogin() {
    runEffect(login()).catch((err) => {
      showErrorToast(err instanceof Error ? err.message : "Login failed")
    })
  }

  function handleLogout() {
    clearAuth()
  }

  function validateFields(): boolean {
    if (Option.isNone(params().password)) {
      showErrorToast("Password is required")
      return false
    }
    return true
  }

  function handleDownload() {
    if (!validateFields()) return
    runEffect(downloadAppleProfile()).catch((err) => {
      showErrorToast(err instanceof Error ? err.message : "Failed to download wifi profile")
    })
  }

  function handleCopyDownloadLink() {
    if (!validateFields()) return
    setCopyingLink(true)
    runEffect(fetchClaimCheckAndCopyLink())
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
    Option.match(effectiveUsername(), {
      onNone: () => {},
      onSome: (u) => {
        navigator.clipboard.writeText(u)
      },
    })
  }

  function handleCopyPassword() {
    Option.match(params().password, {
      onNone: () => {},
      onSome: (p) => {
        navigator.clipboard.writeText(p)
      },
    })
  }

  return (
    <Show
      when={confirmed() && Option.getOrUndefined(requiredParams())}
      keyed
      fallback={
        <WifiSetupView
          ssid={params().ssid}
          encryption={params().encryption}
          password={params().password}
          username={params().username}
          canConfirm={canConfirmSetup()}
          onSsidChange={(v) => $wifiParams.setKey("ssid", v ? Option.some(v) : Option.none())}
          onEncryptionChange={(v) => $wifiParams.setKey("encryption", Option.some(v))}
          onPasswordChange={(v) => $wifiParams.setKey("password", v ? Option.some(v) : Option.none())}
          onUsernameChange={(v) => $wifiParams.setKey("username", v ? Option.some(v) : Option.none())}
          onConfirm={() => setConfirmed(true)}
        />
      }
    >
      {(required) => (
        <WifiPageView
          mounted={mounted()}
          ssid={required.ssid}
          encryption={required.encryption}
          oidcEnabled={oidcEnabled}
          isAuthenticated={isAuthenticated()}
          displayName={displayName()}
          copyingLink={copyingLink()}
          canDownload={canDownload()}
          effectiveUsername={effectiveUsername()}
          username={params().username}
          password={params().password}
          onUsernameChange={(v) => $wifiParams.setKey("username", v ? Option.some(v) : Option.none())}
          onPasswordChange={(v) => $wifiParams.setKey("password", v ? Option.some(v) : Option.none())}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onDownloadAppleProfile={handleDownload}
          onDownloadCert={handleDownloadCert}
          onCopyDownloadLink={handleCopyDownloadLink}
          onCopyUsername={handleCopyUsername}
          onCopyPassword={handleCopyPassword}
          onAdjustParameters={() => setConfirmed(false)}
        />
      )}
    </Show>
  )
}
