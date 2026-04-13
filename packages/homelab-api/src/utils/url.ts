export function originPathnameEquals(a: URL, b: URL) {
  const aStr = `${a.origin}${a.pathname}`
  const bStr = `${b.origin}${b.pathname}`

  return aStr === bStr
}
