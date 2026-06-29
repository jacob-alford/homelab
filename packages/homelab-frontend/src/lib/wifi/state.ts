import type { Option } from "effect"
import { useAppParams } from "../state.js"

export type WifiParams = {
  ssid: Option.Option<string>
  encryption: Option.Option<"WPA2" | "WPA3">
  password: Option.Option<string>
  username: Option.Option<string>
  disableMACRandomization: Option.Option<boolean>
  includeEthernetProfile: Option.Option<boolean>
}

export function useWifiParams() {
  const app = useAppParams()

  const wifiParams = (): WifiParams => {
    const p = app.params()
    return {
      ssid: p.ssid,
      encryption: p.encryption,
      password: p.password,
      username: p.username,
      disableMACRandomization: p.disableMACRandomization,
      includeEthernetProfile: p.includeEthernetProfile,
    }
  }

  return {
    params: wifiParams,
    tab: () => app.params().tab,
    queryString: app.queryString,
    setTab: app.setTab,
    setSSID: app.setSSID,
    setEncryption: app.setEncryption,
    setPassword: app.setPassword,
    setUsername: app.setUsername,
    setDisableMACRandomization: app.setDisableMACRandomization,
    setIncludeEthernetProfile: app.setIncludeEthernetProfile,
  }
}

export type UseWifiParams = ReturnType<typeof useWifiParams>
