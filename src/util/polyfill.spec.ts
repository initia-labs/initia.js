import { bytesFromBase64, base64FromBytes, bytesFromHex, hexFromBytes, bytesFromUtf8, utf8FromBytes } from './polyfill'

describe('base64', () => {
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

describe('hex', () => {
  const hexData = '48656c6c6f20776f726c64'
  const arrData = new Uint8Array([
    72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100,
  ])

  it('should convert hex string to Uint8Array', () => {
    const result = bytesFromHex(hexData)

    expect(result).toEqual(arrData)
  })

  // Handles empty hex strings
  it('should return an empty Uint8Array when given an empty hex string', () => {
    const hex = ''
    const expected = new Uint8Array(0)

    const result = bytesFromHex(hex)

    expect(result).toEqual(expected)
  })

  // Converts a hex string to a Uint8Array using Buffer when available
  it('should convert Uint8Array to hex string', () => {
    const result = hexFromBytes(arrData)

    expect(result).toEqual(hexData)
  })

  // Handles empty hex strings
  it('should return an empty string when given an empty Uint8Array', () => {
    const emptyArr = new Uint8Array(0)
    const expected = ''

    const result = hexFromBytes(emptyArr)

    expect(result).toEqual(expected)
  })
})

describe('utf8', () => {
  const utf8Data = 'hello world'
  const arrData = new Uint8Array([
    104, 101, 108, 108, 111,  32, 119, 111, 114, 108, 100
  ])

  it('should convert utf8 string to Uint8Array', () => {
    const result = bytesFromUtf8(utf8Data)

    expect(result).toEqual(arrData)
  })

  // Handles empty utf8 strings
  it('should return an empty Uint8Array when given an empty utf8 string', () => {
    const utf8 = ''
    const expected = new Uint8Array(0)

    const result = bytesFromUtf8(utf8)

    expect(result).toEqual(expected)
  })

  // Converts a utf8 string to a Uint8Array using Buffer when available
  it('should convert Uint8Array to utf8 string', () => {
    const result = utf8FromBytes(arrData)

    expect(result).toEqual(utf8Data)
  })

  // Handles empty utf8 strings
  it('should return an empty string when given an empty Uint8Array', () => {
    const emptyArr = new Uint8Array(0)
    const expected = ''

    const result = utf8FromBytes(emptyArr)

    expect(result).toEqual(expected)
  })
})
