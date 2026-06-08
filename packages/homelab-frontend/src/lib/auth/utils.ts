import { Effect } from "effect"

export const generateRandomString = (length: number) =>
  Effect.sync(() => {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, length)
  })

const sha256 = Effect.fn("sha256")(function*(plain: string) {
  return yield* Effect.promise(() => crypto.subtle.digest("SHA-256", new TextEncoder().encode(plain)))
})

const base64UrlEncode = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export const generatePKCE = Effect.fn("generatePKCE")(function*() {
  const codeVerifier = yield* generateRandomString(64)
  const hashed = yield* sha256(codeVerifier)
  const codeChallenge = base64UrlEncode(hashed)
  return { codeVerifier, codeChallenge }
})
