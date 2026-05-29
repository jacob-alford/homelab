import { $token } from "../auth/index.js"

export function decodeIdTokenPayload(idToken: string): Record<string, unknown> | null {
  try {
    return JSON.parse(atob(idToken.split(".")[1]))
  } catch {
    return null
  }
}

export function getUsernameFromToken(): string {
  const token = $token.get()
  if (!token?.id_token) return ""
  const payload = decodeIdTokenPayload(token.id_token)
  if (!payload) return ""
  const email = (payload.email ?? payload.preferred_username ?? "") as string
  const atIndex = email.indexOf("@")
  return atIndex > 0 ? email.slice(0, atIndex) : email
}
