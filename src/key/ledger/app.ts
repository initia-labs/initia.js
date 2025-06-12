/* eslint-disable @typescript-eslint/require-await */
import Eth from '@ledgerhq/hw-app-eth'
import { LoadConfig } from '@ledgerhq/hw-app-eth/lib/services/types'
import Cosmos from '@zondax/ledger-cosmos-js'
import Transport from '@ledgerhq/hw-transport'
import * as secp256k1 from 'secp256k1'
import { LedgerError } from '.'
import { EthPublicKey, PublicKey, SimplePublicKey } from '../..'
import * as asn1 from 'asn1-ts'

const HRP = 'init'

// Trim leading zeros
const trimBuffer = (buf: Buffer): Buffer => {
  let i = 0
  while (i < buf.length && buf[i] === 0) i++
  return buf.slice(i)
}

export abstract class LedgerApp {
  public transport: Transport

  constructor(transport: Transport) {
    this.transport = transport
  }

  abstract getAppConfiguration(): Promise<any> // return value may vary
  abstract getVersion(): Promise<string>

  abstract setLoadConfig(config: any): void // Ethereum-only

  abstract getAddress(path: string, display: boolean): Promise<string>
  abstract getPublicKey(path: string, display: boolean): Promise<PublicKey>

  abstract sign(path: string, payload: Buffer): Promise<Buffer>
  abstract signWithKeccak256(path: string, payload: Buffer): Promise<Buffer>
  abstract signText(path: string, payload: string | Buffer): Promise<Buffer>
}

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
    return this.app.setLoadConfig(config)
  }

  async getAddress(path: string, display = false): Promise<string> {
    return (await this.app.getAddress(path, display)).address
  }

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

  async sign(path: string, payload: Buffer): Promise<Buffer> {
    return await this.signWithKeccak256(path, payload)
  }

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

    // Trim leading zeros
    const trimBuffer = (buf: Buffer): Buffer => {
      let i = 0
      while (i < buf.length && buf[i] === 0) i++
      return buf.slice(i)
    }

    const trimmedR = trimBuffer(rValue)
    const trimmedS = trimBuffer(sValue)

    console.log(`r:${trimmedR.length} ${JSON.stringify(trimmedR)}`)
    console.log(`s:${trimmedS.length} ${JSON.stringify(trimmedS)}`)

    // Pad from the left if not big enough (same as Go code)
    trimmedR.copy(signature, 32 - trimmedR.length)
    // Pad from the left if not big enough (same as Go code)
    trimmedS.copy(signature, 64 - trimmedS.length)

    return signature
  }

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
}

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

  async getAddress(path: string, display = false): Promise<string> {
    const pubkey = display
      ? await this.app.showAddressAndPubKey(path, HRP)
      : await this.app.getAddressAndPubKey(path, HRP)
    return pubkey.bech32_address
  }

  async getPublicKey(path: string, display = false): Promise<PublicKey> {
    const pubkey = display
      ? await this.app.showAddressAndPubKey(path, HRP)
      : await this.app.getAddressAndPubKey(path, HRP)
    return new SimplePublicKey(pubkey.compressed_pk.toString('base64'))
  }

  /** Sign with AMINO_JSON sign mode */
  async sign(path: string, payload: string | Buffer): Promise<Buffer> {
    const message = Buffer.isBuffer(payload) ? payload : Buffer.from(payload)

    // txtype 0: P2_VALUES.JSON
    const sigDER = (await this.app.sign(path, message, HRP, 0)).signature

    // signature has been encoded with DER format. need to convert it to BER
    const der = new asn1.DERElement()
    der.fromBytes(sigDER)
    if (der.components.length != 2) {
      throw new LedgerError('invalid signature')
    }

    const r = der.components.at(0)
    if (!r) {
      throw new LedgerError('missing r component in signature')
    }
    const s = der.components.at(1)
    if (!s) {
      throw new LedgerError('missing s component in signature')
    }

    const signature = Buffer.alloc(64)

    const trimmedR = trimBuffer(Buffer.from(r.value))
    const trimmedS = trimBuffer(Buffer.from(s.value))
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

  /** sign with TEXTUAL sign mode
   *
   * NOTE: currently not supported tho
   */
  async signTextual(path: string, payload: string | Buffer): Promise<Buffer> {
    const message = Buffer.isBuffer(payload)
      ? payload
      : Buffer.from(payload, 'utf-8')

    // txtype 1: P2_VALUES.TEXTUAL
    return (await this.app.sign(path, message, HRP, 1)).signature
  }
}
