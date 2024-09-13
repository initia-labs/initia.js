/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-redundant-type-constituents */
declare const self: any | undefined
declare const window: any | undefined
declare const global: any | undefined

const gt: any = (() => {
  if (typeof globalThis !== 'undefined') {
    return globalThis
  }
  if (typeof self !== 'undefined') {
    return self
  }
  if (typeof window !== 'undefined') {
    return window
  }
  if (typeof global !== 'undefined') {
    return global
  }
  throw 'Unable to locate global object'
})()

/**
 * Converts a base64 string to Uint8Array.
 *
 * @param b64 - The base64 string to convert.
 * @returns The Uint8Array representation of the base64 string.
 */
export function bytesFromBase64(b64: string): Uint8Array {
  if (gt.Buffer) {
    return Uint8Array.from(gt.Buffer.from(b64, 'base64'))
  } else {
    const bin = gt.atob(b64)
    const arr = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i)
    }
    return arr
  }
}

/**
 * Converts a Uint8Array to a base64 encoded string.
 * Uses 'Buffer' if available in the global object, otherwise performs the conversion manually.
 *
 * @param arr - The Uint8Array to be converted to base64.
 * @returns The base64 encoded string representation of the input Uint8Array.
 */
export function base64FromBytes(arr: Uint8Array): string {
  if (gt.Buffer) {
    return gt.Buffer.from(arr).toString('base64')
  } else {
    const bin: string[] = []
    arr.forEach((byte) => {
      bin.push(gt.String.fromCharCode(byte))
    })
    return gt.btoa(bin.join(''))
  }
}
