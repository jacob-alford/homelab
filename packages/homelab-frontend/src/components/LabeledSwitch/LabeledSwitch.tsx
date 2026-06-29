import { Switch } from "@kobalte/core/switch"
import "./LabeledSwitch.css"

export interface LabeledSwitchProps {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}

export function LabeledSwitch(props: LabeledSwitchProps) {
  return (
    <Switch
      class="labeled-switch"
      checked={props.checked}
      onChange={props.onChange}
      disabled={props.disabled}
    >
      <Switch.Input class="labeled-switch__input" />
      <Switch.Control class="labeled-switch__control">
        <Switch.Thumb class="labeled-switch__thumb" />
      </Switch.Control>
      <Switch.Label class="labeled-switch__label">{props.label}</Switch.Label>
    </Switch>
  )
}
