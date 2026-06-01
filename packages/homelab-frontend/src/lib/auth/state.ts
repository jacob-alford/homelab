import { Option } from "effect"
import { computed, map, onSet, task } from "nanostores"
import type { TokenResponse } from "./schema.js"

const TOKEN_KEY = "oidc_token"
const TOKEN_EXPIRY_KEY = "oidc_token_expiry"

export type AuthState = {
  token: Option.Option<TokenResponse>
  username: Option.Option<string>
  displayName: Option.Option<string>
}

export const $auth = map<AuthState>({
  token: Option.none(),
  username: Option.none(),
  displayName: Option.none(),
})

export const $isAuthenticated = computed($auth, (s) => Option.isSome(s.token))
export const $displayName = computed($auth, (s) => s.displayName)
export const $username = computed($auth, (s) => s.username)

function decodeIdTokenPayload(idToken: string): Record<string, unknown> | null {
  try {
    return JSON.parse(atob(idToken.split(".")[1]))
  } catch {
    return null
  }
}

function extractUserFields(
  token: TokenResponse,
): { username: Option.Option<string>; displayName: Option.Option<string> } {
  if (!token.id_token) return { username: Option.none(), displayName: Option.none() }
  const payload = decodeIdTokenPayload(token.id_token)
  if (!payload) return { username: Option.none(), displayName: Option.none() }

  const name = (payload.name ?? payload.preferred_username ?? null) as string | null
  const email = (payload.preferred_username ?? payload.email ?? "") as string
  const atIndex = email.indexOf("@")
  const user = atIndex > 0 ? email.slice(0, atIndex) : email

  return {
    username: user ? Option.some(user) : Option.none(),
    displayName: name ? Option.some(name) : Option.none(),
  }
}

export function setAuth(token: TokenResponse): void {
  const { displayName, username } = extractUserFields(token)
  $auth.set({ token: Option.some(token), username, displayName })
}

export function clearAuth(): void {
  $auth.set({ token: Option.none(), username: Option.none(), displayName: Option.none() })
}

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

    setAuth(JSON.parse(raw))
  } catch {
    // ignore parse errors
  }
})

onSet($auth, ({ newValue }) => {
  Option.match(newValue.token, {
    onNone: () => {
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(TOKEN_EXPIRY_KEY)
    },
    onSome: (token) => {
      sessionStorage.setItem(TOKEN_KEY, JSON.stringify(token))
      if (token.expires_in) {
        sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + token.expires_in * 1000))
      }
    },
  })
})
