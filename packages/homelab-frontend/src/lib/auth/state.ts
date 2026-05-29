import { atom, onSet, task } from "nanostores"
import type { TokenResponse } from "./schema.js"

const TOKEN_KEY = "oidc_token"
const TOKEN_EXPIRY_KEY = "oidc_token_expiry"

export const $token = atom<TokenResponse | null>(null)

task(async () => {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY)
    if (!raw) return

    const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY)
    if (expiry && Date.now() > Number(expiry)) {
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(TOKEN_EXPIRY_KEY)
      return
    }

    $token.set(JSON.parse(raw))
  } catch {
    // ignore parse errors
  }
})

onSet($token, ({ newValue }) => {
  if (newValue) {
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify(newValue))
    if (newValue.expires_in) {
      sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + newValue.expires_in * 1000))
    }
  } else {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY)
  }
})
