import { Option, Record } from "effect"
import { map, onSet } from "nanostores"

export type WifiParams = {
  ssid: Option.Option<string>
  encryption: Option.Option<"WPA2" | "WPA3">
  password: Option.Option<string>
  username: Option.Option<string>
  disableMACRandomization: Option.Option<boolean>
  enterpriseClientType: Option.Option<"PEAP" | "EAP-TLS">
}

function initFromURL(): WifiParams {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null
  const enc = params?.get("encryption")
  const ect = params?.get("enterpriseClientType")
  const dmr = params?.get("disableMACRandomization")

  return {
    ssid: Option.fromNullable(params?.get("ssid") || null),
    encryption: Option.fromNullable(
      enc === "WPA2" || enc === "WPA3" ? enc : null,
    ),
    password: Option.fromNullable(params?.get("password") || null),
    username: Option.fromNullable(params?.get("username") || null),
    disableMACRandomization: Option.fromNullable(
      dmr === "true" ? true : dmr === "false" ? false : null,
    ),
    enterpriseClientType: Option.fromNullable(
      ect === "PEAP" || ect === "EAP-TLS" ? ect : null,
    ),
  }
}

export const $wifiParams = map<WifiParams>(initFromURL())

onSet($wifiParams, ({ newValue }) => {
  if (typeof window === "undefined") return

  const somes = Record.getSomes({
    ssid: newValue.ssid,
    encryption: newValue.encryption,
    password: newValue.password,
    username: newValue.username,
    disableMACRandomization: Option.map(newValue.disableMACRandomization, String),
    enterpriseClientType: newValue.enterpriseClientType,
  })

  const qs = new URLSearchParams(somes).toString()
  const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname
  history.replaceState(null, "", newUrl)
})
