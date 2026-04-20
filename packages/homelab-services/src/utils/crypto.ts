export function trimBufferNewlines(buf: Uint8Array): Uint8Array {
  const LINE_FEED = 0x0a
  const CARRIAGE_RETURN = 0x0d

  let end = buf.length

  while (end > 0 && (buf.at(end - 1) === LINE_FEED || buf.at(end - 1) === CARRIAGE_RETURN)) {
    end--
  }

  return buf.subarray(0, end)
}
