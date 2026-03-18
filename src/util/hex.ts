import { ValidationError } from '../errors'

/**
 * Convert a hex string to Uint8Array with input validation.
 * Accepts optional '0x' prefix.
 *
 * @throws {ValidationError} on odd-length or invalid hex characters
 */
export function hexToBytes(hex: string): Uint8Array {
  const h = hex.startsWith('0x') ? hex.slice(2) : hex
  if (h.length % 2 !== 0) {
    throw new ValidationError(
      'hex',
      `Odd-length hex string (${h.length} chars): "${hex}". Hex strings must have an even number of characters.`
    )
  }
  if (h.length > 0 && !/^[0-9a-fA-F]+$/.test(h)) {
    throw new ValidationError(
      'hex',
      `Invalid hex characters in "${hex}". Only 0-9, a-f, A-F are allowed.`
    )
  }
  const bytes = new Uint8Array(h.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}
