import { useStore } from "@nanostores/solid"
import { Option } from "effect"
import { createEffect, createSignal, onMount, Show } from "solid-js"
import * as Lib from "../../lib/index.js"
import { showErrorToast, showSuccessToast } from "../Toast/index.js"
import { WifiPageView } from "./WifiPageView.js"
import { WifiSetupView } from "./WifiSetupView.js"
import "./WifiPage.css"

export function WifiPage() {
  const isAuthenticated = useStore(Lib.Auth.State.$isAuthenticated)
  const username = useStore(Lib.Auth.State.$username)
  const auth = useStore(Lib.Auth.State.$auth)
  const wifi = Lib.Wifi.State.useWifiParams()
  const [mounted, setMounted] = createSignal(false)
  const [copyingLink, setCopyingLink] = createSignal(false)

  const wifiParams = wifi.params

  const requiredParams = () => {
    const p = wifiParams()
    return Option.all({ ssid: p.ssid, encryption: p.encryption, password: p.password })
  }

  const [confirmed, setConfirmed] = createSignal(Option.isSome(requiredParams()))

  const effectiveUsername = () => Option.orElse(wifiParams().username, () => username())

  const canDownload = () => Option.isSome(wifiParams().password)

  const canConfirmSetup = () =>
    Option.isSome(wifiParams().ssid)
    && Option.isSome(wifiParams().encryption)
    && Option.isSome(wifiParams().password)

  const dnsHref = () => {
    const qs = wifi.queryString()
    return qs ? `${Lib.Env.appPath("/dns")}?${qs}` : Lib.Env.appPath("/dns")
  }

  onMount(() => {
    setMounted(true)
    Lib.Runtime.runEffect(Lib.Upgrade.upgradeIfReachable(() => showSuccessToast("Redirecting to internal servers...")))
      .catch(() => {})
  })

  createEffect(() => {
    const u = Option.getOrUndefined(effectiveUsername())
    document.title = u ? `Homelab | Wi-Fi | ${u}` : "Homelab | Wi-Fi"
  })

  function validateFields(): boolean {
    if (Option.isNone(wifiParams().password)) {
      showErrorToast("Password is required")
      return false
    }
    return true
  }

  const token = () =>
    Option.map(auth().token, (t) => t.id_token ?? "").pipe(
      Option.filter((t) => t !== ""),
    )

  function handleDownload() {
    if (!validateFields()) return
    const p = wifiParams()
    Lib.Runtime.runEffect(Lib.Wifi.Effects.downloadAppleProfile({
      ssid: p.ssid,
      encryption: p.encryption,
      password: p.password,
      username: effectiveUsername(),
      disableMACRandomization: p.disableMACRandomization,
      token: token(),
    })).catch((err) => {
      showErrorToast(err instanceof Error ? err.message : "Failed to download wifi profile")
    })
  }

  function handleCopyDownloadLink() {
    if (!validateFields()) return
    setCopyingLink(true)
    const p = wifiParams()
    Lib.Runtime.runEffect(Lib.Wifi.Effects.fetchClaimCheckAndCopyLink({
      ssid: p.ssid,
      encryption: p.encryption,
      password: p.password,
      username: effectiveUsername(),
      disableMACRandomization: p.disableMACRandomization,
      token: token(),
    }))
      .then(() => showSuccessToast("Download link copied to clipboard"))
      .catch((err) => showErrorToast(err instanceof Error ? err.message : "Failed to copy link"))
      .finally(() => setCopyingLink(false))
  }

  function handleDownloadCombinedCert() {
    Lib.Runtime.runEffect(Lib.Wifi.Effects.downloadCombinedCert).catch((err) => {
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
    Option.match(wifiParams().password, {
      onNone: () => {},
      onSome: (p) => {
        navigator.clipboard.writeText(p)
      },
    })
  }

  function handleCopyDomain() {
    navigator.clipboard.writeText("radius.plato-splunk.media")
  }

  function handleTabChange(t: Lib.State.Tab) {
    wifi.setTab(t)
  }

  return (
    <Show
      when={confirmed() && Option.getOrUndefined(requiredParams())}
      keyed
      fallback={
        <WifiSetupView
          ssid={wifiParams().ssid}
          encryption={wifiParams().encryption}
          password={wifiParams().password}
          username={wifiParams().username}
          canConfirm={canConfirmSetup()}
          onSsidChange={(v) => wifi.setSSID(v ? Option.some(v) : Option.none())}
          onEncryptionChange={(v) => wifi.setEncryption(Option.some(v))}
          onPasswordChange={(v) => wifi.setPassword(v ? Option.some(v) : Option.none())}
          onUsernameChange={(v) => wifi.setUsername(v ? Option.some(v) : Option.none())}
          onConfirm={() => setConfirmed(true)}
        />
      }
    >
      {(required) => (
        <WifiPageView
          mounted={mounted()}
          ssid={required.ssid}
          encryption={required.encryption}
          oidcEnabled={Lib.Auth.Env.oidcEnabled}
          isAuthenticated={isAuthenticated()}
          copyingLink={copyingLink()}
          canDownload={canDownload()}
          effectiveUsername={effectiveUsername()}
          username={wifiParams().username}
          password={wifiParams().password}
          tab={wifi.tab()}
          dnsHref={dnsHref()}
          onTabChange={handleTabChange}
          onUsernameChange={(v) => wifi.setUsername(v ? Option.some(v) : Option.none())}
          onPasswordChange={(v) => wifi.setPassword(v ? Option.some(v) : Option.none())}
          onDownloadAppleProfile={handleDownload}
          onDownloadCombinedCert={handleDownloadCombinedCert}
          onCopyDownloadLink={handleCopyDownloadLink}
          onCopyUsername={handleCopyUsername}
          onCopyPassword={handleCopyPassword}
          onCopyDomain={handleCopyDomain}
          onAdjustParameters={() => setConfirmed(false)}
        />
      )}
    </Show>
  )
}
