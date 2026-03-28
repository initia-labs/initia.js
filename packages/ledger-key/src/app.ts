import Eth from '@ledgerhq/hw-app-eth'
import type { LoadConfig } from '@ledgerhq/hw-app-eth/lib/services/types'
import Cosmos from '@zondax/ledger-cosmos-js'
import type Transport from '@ledgerhq/hw-transport'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { hexToBytes, bytesToHex } from '@noble/hashes/utils.js'
import { LedgerError } from './error'

/** Human-readable part for Initia */
const HRP = 'init'

/** Trim leading zero bytes */
const trimLeadingZeros = (bytes: Uint8Array): Uint8Array => {
  let i = 0
  while (i < bytes.length && bytes[i] === 0) i++
  return bytes.subarray(i)
}

/** Pack r and s into a 64-byte compact signature (32 bytes each, right-aligned). */
function packCompactSignature(r: Uint8Array, s: Uint8Array): Uint8Array {
  const sig = new Uint8Array(64)
  const tr = trimLeadingZeros(r)
  const ts = trimLeadingZeros(s)
  sig.set(tr, 32 - tr.length)
  sig.set(ts, 64 - ts.length)
  return sig
}

const derTagInteger = 0x02

// Simplified function ported from cosmjs:
// https://github.com/cosmos/cosmjs/blob/95918dbe0f6b8c37ed512015c32dcfcca3f020da/packages/crypto/src/secp256k1signature.ts#L33
function fromDer(data: Uint8Array): { r: Uint8Array; s: Uint8Array } {
  let pos = 0

  if (data[pos++] !== 0x30) {
    throw new Error('Prefix 0x30 expected')
  }

  const bodyLength = data[pos++]
  if (data.length - pos !== bodyLength) {
    throw new Error('Data length mismatch detected')
  }

  // r
  const rTag = data[pos++]
  if (rTag !== derTagInteger) {
    throw new Error('INTEGER tag expected')
  }
  const rLength = data[pos++]
  if (rLength >= 0x80) {
    throw new Error('Decoding length values above 127 not supported')
  }
  const rData = data.slice(pos, pos + rLength)
  pos += rLength

  // s
  const sTag = data[pos++]
  if (sTag !== derTagInteger) {
    throw new Error('INTEGER tag expected')
  }
  const sLength = data[pos++]
  if (sLength >= 0x80) {
    throw new Error('Decoding length values above 127 not supported')
  }
  const sData = data.slice(pos, pos + sLength)

  return {
    // r/s data can contain leading 0 bytes to express integers being non-negative in DER
    r: trimLeadingZeros(rData),
    s: trimLeadingZeros(sData),
  }
}

/**
 * Abstract base class for Ledger hardware wallet applications.
 * Provides a common interface for both Ethereum and Cosmos implementations.
 */
export abstract class LedgerApp {
  public transport: Transport

  constructor(transport: Transport) {
    this.transport = transport
  }

  /**
   * Retrieves the current application configuration.
   * @returns Application-specific configuration object
   */
  abstract getAppConfiguration(): Promise<unknown>

  /**
   * Gets the current version of the Ledger application.
   * @returns Version string in semver format
   */
  abstract getVersion(): Promise<string>

  /**
   * Gets the minimum required version for this application.
   * @returns Minimum version string in semver format
   */
  abstract getMinimumRequiredVersion(): string

  /**
   * Sets the load configuration for the application.
   * @param config - Configuration object (Ethereum-specific)
   */
  abstract setLoadConfig(config: unknown): void

  /**
   * Retrieves the address for a given derivation path.
   * @param path - HD derivation path
   * @param display - Whether to display the address on the device
   * @returns Address string (hex for Ethereum, bech32 for Cosmos)
   */
  abstract getAddress(path: string, display: boolean): Promise<string>

  /**
   * Retrieves the public key for a given derivation path.
   * @param path - HD derivation path
   * @param display - Whether to display the public key on the device
   * @returns Compressed secp256k1 public key (33 bytes)
   */
  abstract getPublicKey(path: string, display: boolean): Promise<Uint8Array>

  /**
   * Signs a payload using the device.
   * @param path - HD derivation path
   * @param payload - Data to sign
   * @returns Signature bytes (64 bytes, r || s)
   */
  abstract sign(path: string, payload: Uint8Array): Promise<Uint8Array>

  /**
   * Signs a payload using Keccak256 hash.
   * @param path - HD derivation path
   * @param payload - Data to sign
   * @returns Signature bytes (64 bytes, r || s)
   */
  abstract signWithKeccak256(path: string, payload: Uint8Array): Promise<Uint8Array>

  /**
   * Signs a text message.
   * @param path - HD derivation path
   * @param payload - Text or bytes to sign
   * @returns Signature bytes (64 bytes, r || s)
   */
  abstract signText(path: string, payload: string | Uint8Array): Promise<Uint8Array>
}

/**
 * Ethereum-specific Ledger application implementation.
 * Handles Ethereum-specific operations and signing methods.
 */
export class EthereumApp extends LedgerApp {
  public app: Eth

  constructor(transport: Transport) {
    super(transport)
    this.app = new Eth(transport)
  }

  async getVersion(): Promise<string> {
    const { version } = (await this.getAppConfiguration()) as { version: string }
    return version
  }

  async getAppConfiguration(): Promise<unknown> {
    return this.app.getAppConfiguration()
  }

  setLoadConfig(config: LoadConfig): void {
    this.app.setLoadConfig(config)
  }

  /**
   * Retrieves an Ethereum address for the given derivation path.
   * @param path - HD derivation path
   * @param display - Whether to display the address on the device
   * @returns Ethereum address in hex format
   */
  async getAddress(path: string, display = false): Promise<string> {
    return (await this.app.getAddress(path, display)).address
  }

  /**
   * Retrieves the compressed public key for the given derivation path.
   * @param path - HD derivation path
   * @param display - Whether to display the public key on the device
   * @returns Compressed secp256k1 public key (33 bytes)
   */
  async getPublicKey(path: string, display = false): Promise<Uint8Array> {
    const { publicKey: publicKeyStr } = await this.app.getAddress(path, display)

    switch (publicKeyStr.length) {
      case 66: // already compressed (33 bytes = 66 hex chars)
        return hexToBytes(publicKeyStr)
      case 128: // uncompressed without 04 prefix (64 bytes = 128 hex chars)
        return secp256k1.Point.fromHex('04' + publicKeyStr).toBytes(true)
      case 130: // uncompressed with 04 prefix (65 bytes = 130 hex chars)
        return secp256k1.Point.fromHex(publicKeyStr).toBytes(true)
      default:
        throw new LedgerError(`Invalid public key length: ${publicKeyStr.length}`)
    }
  }

  /**
   * Signs a payload using Keccak256 (delegates to signWithKeccak256).
   * @param path - HD derivation path
   * @param payload - Data to sign
   * @returns Signature bytes (64 bytes, r || s)
   */
  async sign(path: string, payload: Uint8Array): Promise<Uint8Array> {
    return this.signWithKeccak256(path, payload)
  }

  /**
   * Signs a payload using Keccak256 hash via personal_sign.
   * Strips the EIP-191 prefix to extract the JSON payload before signing.
   * @param path - HD derivation path
   * @param payload - Data to sign (with EIP-191 prefix)
   * @returns Signature bytes (64 bytes, r || s)
   */
  async signWithKeccak256(path: string, payload: Uint8Array): Promise<Uint8Array> {
    // remove EIP-191 prefix — find the start of the JSON object
    const loc = payload.indexOf(0x7b) // '{' in ASCII
    if (loc === -1) {
      throw new LedgerError('Invalid payload: no JSON object found')
    }
    const jsonPayload = payload.subarray(loc)

    const { s, r } = await this.app.signPersonalMessage(path, bytesToHex(jsonPayload))
    return packCompactSignature(hexToBytes(r), hexToBytes(s))
  }

  /**
   * Signs raw data via personal_sign without any prefix manipulation.
   * The Ledger Ethereum app's signPersonalMessage internally handles
   * the EIP-191 prefix, so the caller should pass raw bytes (e.g., amino JSON).
   * @param path - HD derivation path
   * @param data - Raw bytes to sign
   * @returns Signature bytes (64 bytes, r || s)
   */
  async signPersonal(path: string, data: Uint8Array): Promise<Uint8Array> {
    const { s, r } = await this.app.signPersonalMessage(path, bytesToHex(data))
    return packCompactSignature(hexToBytes(r), hexToBytes(s))
  }

  /**
   * Signs a text message using personal_sign.
   * @param path - HD derivation path
   * @param payload - Text or bytes to sign
   * @returns Signature bytes (64 bytes, r || s)
   */
  async signText(path: string, payload: string | Uint8Array): Promise<Uint8Array> {
    const message = typeof payload === 'string' ? new TextEncoder().encode(payload) : payload
    const { s, r } = await this.app.signPersonalMessage(path, bytesToHex(message))
    return packCompactSignature(hexToBytes(r), hexToBytes(s))
  }

  getMinimumRequiredVersion(): string {
    return '1.17.0'
  }
}

/**
 * Cosmos-specific Ledger application implementation.
 * Handles Cosmos App-specific operations and AMINO_JSON signing.
 */
export class CosmosApp extends LedgerApp {
  public app: Cosmos

  constructor(transport: Transport) {
    super(transport)
    this.app = new Cosmos(transport)
  }

  async getVersion(): Promise<string> {
    const { major, minor, patch } = await this.app.getVersion()
    return `${major ?? 0}.${minor ?? 0}.${patch ?? 0}`
  }

  async getAppConfiguration(): Promise<unknown> {
    return this.app.appInfo()
  }

  setLoadConfig(_config: unknown): void {
    throw new LedgerError('setLoadConfig is not supported for CosmosApp')
  }

  /**
   * Retrieves a Cosmos address for the given derivation path.
   * @param path - HD derivation path
   * @param display - Whether to display the address on the device
   * @returns Bech32 encoded address
   */
  async getAddress(path: string, display = false): Promise<string> {
    const pubkey = display
      ? await this.app.showAddressAndPubKey(path, HRP)
      : await this.app.getAddressAndPubKey(path, HRP)
    return pubkey.bech32_address
  }

  /**
   * Retrieves the compressed public key for the given derivation path.
   * @param path - HD derivation path
   * @param display - Whether to display the public key on the device
   * @returns Compressed secp256k1 public key (33 bytes)
   */
  async getPublicKey(path: string, display = false): Promise<Uint8Array> {
    const pubkey = display
      ? await this.app.showAddressAndPubKey(path, HRP)
      : await this.app.getAddressAndPubKey(path, HRP)
    return new Uint8Array(pubkey.compressed_pk)
  }

  /**
   * Signs a payload using AMINO_JSON sign mode.
   * Parses the DER-encoded signature and returns it in compact r || s format.
   * @param path - HD derivation path
   * @param payload - Data to sign
   * @returns Signature bytes (64 bytes, r || s)
   */
  async sign(path: string, payload: Uint8Array): Promise<Uint8Array> {
    // txtype 0: P2_VALUES.JSON
    const sigDER = (await this.app.sign(path, Buffer.from(payload), HRP, 0)).signature

    const parsed = fromDer(sigDER)
    if (!parsed || !parsed.r || !parsed.s) {
      throw new LedgerError('Invalid signature format')
    }
    return packCompactSignature(parsed.r, parsed.s)
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async signWithKeccak256(_path: string, _payload: Uint8Array): Promise<Uint8Array> {
    throw new LedgerError('signWithKeccak256 is not supported for CosmosApp')
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async signText(_path: string, _payload: string | Uint8Array): Promise<Uint8Array> {
    throw new LedgerError('signText is not supported for CosmosApp')
  }

  /**
   * Signs a payload using TEXTUAL sign mode.
   * @param path - HD derivation path
   * @param payload - Data to sign
   * @returns Signature bytes from the Cosmos app
   */
  async signTextual(path: string, payload: string | Uint8Array): Promise<Uint8Array> {
    const message = typeof payload === 'string' ? new TextEncoder().encode(payload) : payload
    // txtype 1: P2_VALUES.TEXTUAL
    const result = await this.app.sign(path, Buffer.from(message), HRP, 1)
    const parsed = fromDer(new Uint8Array(result.signature))
    return packCompactSignature(parsed.r, parsed.s)
  }

  getMinimumRequiredVersion(): string {
    return '2.37.3'
  }
}
