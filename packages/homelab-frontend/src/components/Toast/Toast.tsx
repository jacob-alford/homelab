import { Toast, toaster } from "@kobalte/core/toast"
import "./Toast.css"

export function showErrorToast(message: string) {
  toaster.show((props) => (
    <Toast toastId={props.toastId} class="toast toast--error">
      <Toast.Title class="toast__title">Error</Toast.Title>
      <Toast.Description class="toast__description">{message}</Toast.Description>
      <Toast.CloseButton class="toast__close-btn">✕</Toast.CloseButton>
      <Toast.ProgressTrack class="toast__progress-track">
        <Toast.ProgressFill class="toast__progress-fill" />
      </Toast.ProgressTrack>
    </Toast>
  ))
}

export function showSuccessToast(message: string) {
  toaster.show((props) => (
    <Toast toastId={props.toastId} class="toast toast--success">
      <Toast.Title class="toast__title toast__title--success">Success</Toast.Title>
      <Toast.Description class="toast__description">{message}</Toast.Description>
      <Toast.CloseButton class="toast__close-btn">✕</Toast.CloseButton>
      <Toast.ProgressTrack class="toast__progress-track">
        <Toast.ProgressFill class="toast__progress-fill toast__progress-fill--success" />
      </Toast.ProgressTrack>
    </Toast>
  ))
}

export function ToastRegion() {
  return (
    <Toast.Region>
      <Toast.List class="toast__list" />
    </Toast.Region>
  )
}
