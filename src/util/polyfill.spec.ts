import { bytesFromBase64, base64FromBytes } from './polyfill'

describe('bytesFromBase64', () => {
  const b64Data = 'SGVsbG8gd29ybGQ='
  const arrData = new Uint8Array([
    72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100,
  ])

  it('should convert base64 string to Uint8Array', () => {
    const result = bytesFromBase64(b64Data)

    expect(result).toEqual(arrData)
  })

  // Handles empty base64 strings
  it('should return an empty Uint8Array when given an empty base64 string', () => {
    const b64 = ''
    const expected = new Uint8Array(0)

    const result = bytesFromBase64(b64)

    expect(result).toEqual(expected)
  })

  // Converts a base64 string to a Uint8Array using Buffer when available
  it('should convert Uint8Array to base64 string', () => {
    const result = base64FromBytes(arrData)

    expect(result).toEqual(b64Data)
  })

  // Handles empty base64 strings
  it('should return an empty string when given an empty Uint8Array', () => {
    const emptyArr = new Uint8Array(0)
    const expected = ''

    const result = base64FromBytes(emptyArr)

    expect(result).toEqual(expected)
  })
})
