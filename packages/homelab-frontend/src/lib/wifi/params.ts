import { Option, Record } from "effect"
import { atom, map, onSet } from "nanostores"

export type WifiTab = "apple" | "android"

export type WifiParams = {
  ssid: Option.Option<string>
  encryption: Option.Option<"WPA2" | "WPA3">
  password: Option.Option<string>
  username: Option.Option<string>
  disableMACRandomization: Option.Option<boolean>
}

function initTabFromURL(): WifiTab {
  if (typeof window === "undefined") return "apple"
  const tab = new URLSearchParams(window.location.search).get("tab")
  return tab === "android" ? "android" : "apple"
}

function initFromURL(): WifiParams {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null
  const enc = params?.get("encryption")
  const dmr = params?.get("disableMACRandomization")

  return {
    ssid: Option.fromNullable(params?.get("ssid") || null),
    encryption: Option.some(
      enc === "WPA2" || enc === "WPA3" ? enc : "WPA3" as const,
    ),
    password: Option.fromNullable(params?.get("password") || null),
    username: Option.fromNullable(params?.get("username") || null),
    disableMACRandomization: Option.fromNullable(
      dmr === "true" ? true : dmr === "false" ? false : null,
    ),
  }
}

export const $wifiTab = atom<WifiTab>(initTabFromURL())

export const $wifiParams = map<WifiParams>(initFromURL())

function syncURL() {
  if (typeof window === "undefined") return

  const params = $wifiParams.get()
  const tab = $wifiTab.get()

  const somes = Record.getSomes({
    ssid: params.ssid,
    encryption: params.encryption,
    password: params.password,
    username: params.username,
    disableMACRandomization: Option.map(params.disableMACRandomization, String),
    tab: tab === "android" ? Option.some("android") : Option.none(),
  })

  const qs = new URLSearchParams(somes).toString()
  const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname
  history.replaceState(null, "", newUrl)
}

onSet($wifiParams, () => syncURL())
onSet($wifiTab, () => syncURL())
