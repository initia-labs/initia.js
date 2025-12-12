/* eslint-disable @typescript-eslint/require-await */
import Eth from '@ledgerhq/hw-app-eth'
import { LoadConfig } from '@ledgerhq/hw-app-eth/lib/services/types'
import Cosmos from '@zondax/ledger-cosmos-js'
import Transport from '@ledgerhq/hw-transport'
import * as secp256k1 from 'secp256k1'
import { LedgerError } from './error'
import { EthPublicKey, PublicKey, SimplePublicKey } from '@initia/initia.js'

/** Human-readable part for Initia */
const HRP = 'init'

// Trim leading zeros
const trimBuffer = (buf: Buffer): Buffer => {
  let i = 0
  while (i < buf.length && buf[i] === 0) i++
  return buf.subarray(i)
}

const derTagInteger = 0x02

// simplfied function copied from comjs: https://github.com/cosmos/cosmjs/blob/95918dbe0f6b8c37ed512015c32dcfcca3f020da/packages/crypto/src/secp256k1signature.ts#L33
function fromDer(data: Buffer): { r: Buffer; s: Buffer } {
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
  pos += sLength

  return {
    // r/s data can contain leading 0 bytes to express integers being non-negative in DER
    r: trimBuffer(rData),
    s: trimBuffer(sData),
  }
}

/**
 * Abstract base class for Ledger hardware wallet applications
 * Provides common interface for both Ethereum and Cosmos implementations
 */
export abstract class LedgerApp {
  public transport: Transport

  constructor(transport: Transport) {
    this.transport = transport
  }

  /**
   * Retrieves the current application configuration
   * @returns Application-specific configuration object
   */
  abstract getAppConfiguration(): Promise<any>

  /**
   * Gets the current version of the Ledger application
   * @returns Version string in semver format
   */
  abstract getVersion(): Promise<string>

  /**
   * Gets the minimum required version for this application
   * @returns Minimum version string in semver format
   */
  abstract getMininumRequiredVersion(): string

  /**
   * Sets the load configuration for the application
   * @param config - Configuration object (Ethereum-specific)
   */
  abstract setLoadConfig(config: any): void

  /**
   * Retrieves the address for a given derivation path
   * @param path - HD derivation path
   * @param display - Whether to display the address on the device
   * @returns Address string (in hex for Etherum and in bech32 for Cosmos)
   */
  abstract getAddress(path: string, display: boolean): Promise<string>

  /**
   * Retrieves the public key for a given derivation path
   * @param path - HD derivation path
   * @param display - Whether to display the public key on the device
   * @returns PublicKey object
   */
  abstract getPublicKey(path: string, display: boolean): Promise<PublicKey>

  /**
   * Signs a payload using the device
   * @param path - HD derivation path
   * @param payload - Data to sign
   * @returns Signature buffer
   */
  abstract sign(path: string, payload: Buffer): Promise<Buffer>

  /**
   * Signs a payload using Keccak256 hash
   * @param path - HD derivation path
   * @param payload - Data to sign
   * @returns Signature buffer
   */
  abstract signWithKeccak256(path: string, payload: Buffer): Promise<Buffer>

  /**
   * Signs a text message
   * @param path - HD derivation path
   * @param payload - Text or buffer to sign
   * @returns Signature buffer
   */
  abstract signText(path: string, payload: string | Buffer): Promise<Buffer>
}

/**
 * Ethereum-specific Ledger application implementation
 * Handles Ethereum-specific operations and signing methods
 */
export class EthereumApp extends LedgerApp {
  public app: Eth

  constructor(transport: Transport) {
    super(transport)
    this.app = new Eth(transport)
  }

  async getVersion(): Promise<string> {
    const { version } = await this.getAppConfiguration()
    return version
  }

  async getAppConfiguration(): Promise<any> {
    return this.app.getAppConfiguration()
  }

  setLoadConfig(config: LoadConfig): void {
    this.app.setLoadConfig(config)
  }

  /**
   * Retrieves an Ethereum address for the given derivation path
   * @param path - HD derivation path
   * @param display - Whether to display the address on the device
   * @returns Ethereum address in hex format
   */
  async getAddress(path: string, display = false): Promise<string> {
    return (await this.app.getAddress(path, display)).address
  }

  /**
   * Retrieves the public key for the given derivation path
   * @param path - HD derivation path
   * @param display - Whether to display the public key on the device
   * @returns EthPublicKey object
   */
  async getPublicKey(path: string, display = false): Promise<PublicKey> {
    let { publicKey: publicKeyStr } = await this.app.getAddress(path, display)

    let buf: Uint8Array
    switch (publicKeyStr.length) {
      case 66: // publicKey is already compressed
        buf = secp256k1.publicKeyConvert(Buffer.from(publicKeyStr, 'hex'), true)
        publicKeyStr = Buffer.from(buf).toString('base64')
        return new EthPublicKey(publicKeyStr)
      case 128:
      case 130: // uncompressed case with or without 04 prefix
        if (publicKeyStr.length === 128) {
          publicKeyStr = '04' + publicKeyStr
        }
        buf = secp256k1.publicKeyConvert(Buffer.from(publicKeyStr, 'hex'), true)
        publicKeyStr = Buffer.from(buf).toString('base64')
        return new EthPublicKey(publicKeyStr)
      default:
        throw new Error('Invalid public key length')
    }
  }

  /**
   * Signs a payload using the device
   * @param path - HD derivation path
   * @param payload - Data to sign
   * @returns Signature buffer
   */
  async sign(path: string, payload: Buffer): Promise<Buffer> {
    return await this.signWithKeccak256(path, payload)
  }

  /**
   * Signs a payload using Keccak256 hash
   * @param path - HD derivation path
   * @param payload - Data to sign
   * @returns Signature buffer
   */
  async signWithKeccak256(path: string, payload: Buffer): Promise<Buffer> {
    // remove EIP191 prefix
    const loc = payload.indexOf('{')
    if (loc === -1) {
      throw new LedgerError('Invalid payload: no JSON object found')
    }
    // Extract the JSON object from the payload
    payload = payload.subarray(loc)

    const { s, r } = await this.app.signPersonalMessage(
      path,
      payload.toString('hex')
    )

    // Pad r and s to 32 bytes each
    const signature = Buffer.alloc(64)
    const rValue = Buffer.from(r, 'hex')
    const sValue = Buffer.from(s, 'hex')

    const trimmedR = trimBuffer(rValue)
    const trimmedS = trimBuffer(sValue)

    trimmedR.copy(signature, 32 - trimmedR.length)
    trimmedS.copy(signature, 64 - trimmedS.length)

    return signature
  }

  /**
   * Signs a text message using personal_sign
   * @param path - HD derivation path
   * @param payload - Text or buffer to sign
   * @returns Signature buffer
   */
  async signText(path: string, payload: string | Buffer): Promise<Buffer> {
    const message = Buffer.isBuffer(payload)
      ? payload
      : Buffer.from(payload, 'utf-8')

    const { s, r } = await this.app.signPersonalMessage(
      path,
      message.toString('hex')
    )
    return Buffer.from(r + s, 'hex')
  }

  getMininumRequiredVersion(): string {
    return '1.17.0'
  }
}

/**
 * Cosmos-specific Ledger application implementation
 * Handles Cosmos-App-specific operations and signing methods
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

  async getAppConfiguration(): Promise<any> {
    return await this.app.appInfo() // return app info instead of app configuration
  }

  setLoadConfig(_config: any): void {
    throw new LedgerError('setLoadConfig is not supported')
  }

  /**
   * Retrieves a Cosmos address for the given derivation path
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
   * Retrieves the public key for the given derivation path
   * @param path - HD derivation path
   * @param display - Whether to display the public key on the device
   * @returns SimplePublicKey object
   */
  async getPublicKey(path: string, display = false): Promise<PublicKey> {
    const pubkey = display
      ? await this.app.showAddressAndPubKey(path, HRP)
      : await this.app.getAddressAndPubKey(path, HRP)
    return new SimplePublicKey(pubkey.compressed_pk.toString('base64'))
  }

  /**
   * Signs a payload using AMINO_JSON sign mode
   * @param path - HD derivation path
   * @param payload - Data to sign
   * @returns Signature buffer
   */
  async sign(path: string, payload: string | Buffer): Promise<Buffer> {
    const message = Buffer.isBuffer(payload) ? payload : Buffer.from(payload)

    // txtype 0: P2_VALUES.JSON
    const sigDER = (await this.app.sign(path, message, HRP, 0)).signature

    // Parse the DER signature using asn1.js
    const parsed = fromDer(sigDER)
    if (!parsed || !parsed.r || !parsed.s) {
      throw new LedgerError('Invalid signature format')
    }

    const signature = Buffer.alloc(64)
    const trimmedR = trimBuffer(parsed.r)
    const trimmedS = trimBuffer(parsed.s)
    trimmedR.copy(signature, 32 - trimmedR.length)
    trimmedS.copy(signature, 64 - trimmedS.length)
    return signature
  }

  async signWithKeccak256(_path: string, _payload: Buffer): Promise<Buffer> {
    throw new LedgerError('signWithKeccak256 is not supported')
  }

  async signText(_path: string, _payload: string | Buffer): Promise<Buffer> {
    throw new LedgerError('signText is not supported')
  }

  /**
   * Signs a payload using TEXTUAL sign mode
   * Note: Currently not supported
   * @param path - HD derivation path
   * @param payload - Data to sign
   * @returns Signature buffer
   */
  async signTextual(path: string, payload: string | Buffer): Promise<Buffer> {
    const message = Buffer.isBuffer(payload)
      ? payload
      : Buffer.from(payload, 'utf-8')

    // txtype 1: P2_VALUES.TEXTUAL
    return (await this.app.sign(path, message, HRP, 1)).signature
  }

  getMininumRequiredVersion(): string {
    return '2.37.3'
  }
}
