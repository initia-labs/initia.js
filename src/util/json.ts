/**
 * JSON ↔ Uint8Array encoding utilities.
 *
 * Used by CosmWasm contracts and message builders for JSON-based messages.
 */

/**
 * Encode a JSON-serializable object to Uint8Array.
 */
export function encodeMsg(msg: object): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(msg))
}

/**
 * JSON.stringify with bigint support for Move JSON args.
 *
 * - bigint → JSON-encoded string (e.g., returns `'"1000000"'`)
 * - undefined → throws (JSON.stringify returns JS undefined, not a string)
 * - NaN / Infinity → throws (JSON.stringify produces "null", which is misleading)
 * - All other types → standard JSON.stringify
 */
export function jsonStringifyArg(arg: unknown): string {
  if (arg === undefined) {
    throw new Error('Cannot serialize undefined as a Move JSON argument. Check for missing values.')
  }
  if (typeof arg === 'number' && !Number.isFinite(arg)) {
    throw new Error(
      `Cannot serialize ${arg} as a Move JSON argument. NaN and Infinity are not valid.`
    )
  }
  return typeof arg === 'bigint' ? JSON.stringify(arg.toString()) : JSON.stringify(arg)
}

/**
 * Decode Uint8Array to a parsed JSON value.
 * Falls back to raw string if JSON parsing fails.
 */
export function decodeResponse(data: Uint8Array): unknown {
  const text = new TextDecoder().decode(data)
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}
