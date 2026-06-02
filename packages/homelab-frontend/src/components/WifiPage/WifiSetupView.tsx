import { Button } from "@kobalte/core/button"
import { Select } from "@kobalte/core/select"
import { TextField } from "@kobalte/core/text-field"
import { Option } from "effect"

export interface WifiSetupViewProps {
  ssid: Option.Option<string>
  encryption: Option.Option<"WPA2" | "WPA3">
  password: Option.Option<string>
  username: Option.Option<string>
  canConfirm: boolean
  onSsidChange: (value: string) => void
  onEncryptionChange: (value: "WPA2" | "WPA3") => void
  onPasswordChange: (value: string) => void
  onUsernameChange: (value: string) => void
  onConfirm: () => void
}

const ENCRYPTION_OPTIONS: Array<"WPA2" | "WPA3"> = ["WPA3", "WPA2"]

export function WifiSetupView(props: WifiSetupViewProps) {
  return (
    <div class="wifi-page">
      <div class="wifi-page__setup">
        <h2 class="wifi-page__setup-heading">Configure WiFi Network</h2>
        <div class="wifi-page__setup-fields">
          <TextField
            class="wifi-page__override-field"
            value={Option.getOrElse(props.ssid, () => "")}
            onChange={props.onSsidChange}
          >
            <TextField.Label class="wifi-page__override-label">SSID</TextField.Label>
            <TextField.Input class="wifi-page__override-input" placeholder="Network name" />
          </TextField>

          <Select<"WPA2" | "WPA3">
            class="wifi-page__override-field"
            options={ENCRYPTION_OPTIONS}
            value={Option.getOrElse(props.encryption, () => "WPA3" as const)}
            onChange={(v) => {
              if (v) props.onEncryptionChange(v)
            }}
            placeholder="Select encryption"
            itemComponent={(itemProps) => (
              <Select.Item item={itemProps.item} class="wifi-page__select-item">
                <Select.ItemLabel>{itemProps.item.rawValue}</Select.ItemLabel>
              </Select.Item>
            )}
          >
            <Select.Label class="wifi-page__override-label">Encryption</Select.Label>
            <Select.Trigger class="wifi-page__select-trigger">
              <Select.Value<"WPA2" | "WPA3">>
                {(state) => state.selectedOption()}
              </Select.Value>
            </Select.Trigger>
            <Select.Content class="wifi-page__select-content">
              <Select.Listbox class="wifi-page__select-listbox" />
            </Select.Content>
          </Select>

          <TextField
            class="wifi-page__override-field"
            value={Option.getOrElse(props.password, () => "")}
            onChange={props.onPasswordChange}
          >
            <TextField.Label class="wifi-page__override-label">Password</TextField.Label>
            <TextField.Input class="wifi-page__override-input" placeholder="Required" />
          </TextField>

          <TextField
            class="wifi-page__override-field"
            value={Option.getOrElse(props.username, () => "")}
            onChange={props.onUsernameChange}
          >
            <TextField.Label class="wifi-page__override-label">Username</TextField.Label>
            <TextField.Input class="wifi-page__override-input" placeholder="Optional" />
          </TextField>
        </div>

        <Button
          class="wifi-page__download-btn"
          disabled={!props.canConfirm}
          onClick={props.onConfirm}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
