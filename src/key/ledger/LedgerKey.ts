/* eslint-disable @typescript-eslint/no-unused-vars */
import * as semver from 'semver'
import Transport from '@ledgerhq/hw-transport'
import Eth from '@ledgerhq/hw-app-eth'
import ledgerService from '@ledgerhq/hw-app-eth/lib/services/ledger/index.js'
import { AccAddress, SignatureV2, SignDoc, EthPublicKey } from '../..'
import { Key } from '../Key'
import { INIT_COIN_TYPE } from '../MnemonicKey'
import * as secp256k1 from 'secp256k1'
import { LoadConfig } from '@ledgerhq/hw-app-eth/lib/services/types'

const INTERACTION_TIMEOUT = 120
const REQUIRED_APP_VERSION = '1.0.0'

declare global {
  interface Window {
    google: any
  }
  interface Navigator {
    hid: any
  }
}

export interface CommonResponse {
  return_code: number
  error_message: string
  device_locked?: boolean
}

export class LedgerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LedgerError'
  }
}

/**
 * Key implementation that uses Ledger to sign transactions. Keys should be registered
 * in Ledger device
 */
export class LedgerKey extends Key {
  private transport: Transport
  private app: Eth
  private path: number[] = [44, INIT_COIN_TYPE, 0, 0, 0]

  /**
   * @param transport transporter for LedgerKey
   */
  constructor(transport: Transport) {
    super()
    this.transport = transport
    this.app = new Eth(transport)
  }

  /**
   *
   * Initia account address. `init-` prefixed.
   */
  public get accAddress(): AccAddress {
    if (!this.publicKey) {
      throw new Error('Ledger is uninitialized. Initialize it first.')
    }

    return this.publicKey.address()
  }

  /**
   * create and return initialized ledger key
   */
  public static async create(
    transport?: Transport,
    index?: number
  ): Promise<LedgerKey> {
    if (!transport) {
      transport = await createTransport()
    }

    const key = new LedgerKey(transport)

    if (index != undefined) {
      key.path[4] = index
    }

    // TODO: remove this.. why is it needed?
    // if (transport && typeof transport.on === 'function') {
    //   transport.on('disconnect', () => {
    //     key.transport = undefined
    //   })
    // }

    await key.initialize().catch(handleConnectError)
    return key
  }

  /**
   * initialize LedgerKey.
   * it loads accAddress and publicKey from connected Ledger
   */
  private async initialize() {
    const { version } = await this.app.getAppConfiguration()
    if (semver.lt(version, REQUIRED_APP_VERSION)) {
      throw new LedgerError(
        'Outdated version: Update Ledger Ethereum App to the latest version'
      )
    }
    await this.loadAccountDetails()
  }

  /**
   * Set Load Config for Ledger app.
   * This is used to configure how the Ledger app loads transactions.
   * @param loadConfig - LoadConfig object to set
   * @throws {LedgerError} if the Ledger app is not initialized
   */
  public setLoadConfig(loadConfig: LoadConfig): void {
    if (!this.app) {
      throw new LedgerError('Ledger app is not initialized')
    }
    this.app.setLoadConfig(loadConfig)
  }

  /**
   * Returns the BIP44 path for the LedgerKey as a string.
   * @returns Path for LedgerKey in BIP44 format.
   */
  public getPath(): string {
    //    * eth.getAddress("44'/60'/0'/0/0").then(o => o.address)
    return `${this.path[0]}'/${this.path[1]}'/${this.path[2]}'/${this.path[3]}/${this.path[4]}`
  }

  /**
   * get Address and Pubkey from Ledger
   */
  public async loadAccountDetails(): Promise<LedgerKey> {
    let { publicKey: publicKeyStr } = await this.app.getAddress(
      this.getPath(),
      false
    )

    let buf: Uint8Array
    switch (publicKeyStr.length) {
      case 66: // publicKey is already compressed
        buf = secp256k1.publicKeyConvert(Buffer.from(publicKeyStr, 'hex'), true)
        publicKeyStr = Buffer.from(buf).toString('base64')
        this.publicKey = new EthPublicKey(publicKeyStr)
        break
      case 128:
      case 130: // uncompressed case with or without 04 prefix
        if (publicKeyStr.length === 128) {
          publicKeyStr = '04' + publicKeyStr
        }
        buf = secp256k1.publicKeyConvert(Buffer.from(publicKeyStr, 'hex'), true)
        publicKeyStr = Buffer.from(buf).toString('base64')
        this.publicKey = new EthPublicKey(publicKeyStr)
        break
      default:
        throw new Error('Invalid public key length')
    }

    return this
  }

  /** Signs a message with the LedgerKey. This method is identical to `signWithKeccak256`, but it is used for legacy compatibility. */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async sign(payload: Buffer): Promise<Buffer> {
    return await this.signWithKeccak256(payload)
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async signWithKeccak256(payload: Buffer): Promise<Buffer> {
    /* no need to check if publicKey is set here, as it is checked in the signTransaction method 
    if (!this.publicKey) {
      await this.loadAccountDetails()
    }
    */

    // remove EIP191 prefix
    const loc = payload.indexOf('{')
    if (loc === -1) {
      throw new LedgerError('Invalid payload: no JSON object found')
    }
    // Extract the JSON object from the payload
    payload = payload.subarray(loc)

    const { s, r } = await this.app.signPersonalMessage(
      this.getPath(),
      payload.toString('hex')
    )

    return Buffer.from(r + s, 'hex')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/require-await
  public async createSignature(_tx: SignDoc): Promise<SignatureV2> {
    throw new Error('direct sign mode is not supported')
  }

  public async signText(payload: string | Buffer): Promise<Buffer> {
    /* no need/
    if (!this.publicKey) {
      await this.loadAccountDetails()
    }
    */
    const message = Buffer.isBuffer(payload)
      ? payload
      : Buffer.from(payload, 'utf-8')

    const { s, r } = await this.app.signPersonalMessage(
      this.getPath(),
      message.toString('hex')
    )

    return Buffer.from(r + s, 'hex')
  }

  /**
   *
   * @returns Ledger app instance.
   */
  public getApp(): Eth {
    if (!this.app) {
      throw new LedgerError('Ledger app is not initialized')
    }
    return this.app
  }

  /**
   * Get ledger app configuration
   * @returns arbitraryDataEnabled, erc20ProvisioningNecessary, starkEnabled, starkv2Supported, version
   * @throws {LedgerError} if the Ledger app is not initialized or if there is an error retrieving the configuration.
   */
  public async getAppConfiguration(): Promise<{
    arbitraryDataEnabled: number
    erc20ProvisioningNecessary: number
    starkEnabled: number
    starkv2Supported: number
    version: string
  }> {
    return await this.app.getAppConfiguration()
  }

  /**
   * Show address and public key in Ledger device.
   * This method will prompt the user to confirm the address and public key on the Ledger device.
   * It is useful for verifying that the correct account is being used before signing transactions.
   */
  public async showAddressAndPubKey() {
    await this.app.getAddress(this.getPath(), true)
  }
}

const handleConnectError = (err: Error) => {
  const message = err.message.trim()

  if (message.startsWith('The device is already open')) {
    // ignore this error
    return //transport
  }

  if (err.name === 'TransportOpenUserCancelled') {
    throw new LedgerError(
      "Couldn't find the Ledger. Check the Ledger is plugged in and unlocked."
    )
  }

  /* istanbul ignore next: specific error rewrite */
  if (message.startsWith('No WebUSB interface found for the Ledger device')) {
    throw new LedgerError(
      `Couldn't connect to a Ledger device. Use Ledger Live to upgrade the Ledger firmware to version ${REQUIRED_APP_VERSION} or later.`
    )
  }

  /* istanbul ignore next: specific error rewrite */
  if (message.startsWith('Unable to claim interface')) {
    // apparently can't use it in several tabs in parallel
    throw new LedgerError(
      "Couldn't access Ledger device. Is it being used in another tab?"
    )
  }

  /* istanbul ignore next: specific error rewrite */
  if (message.startsWith('Transport not defined')) {
    // apparently can't use it in several tabs in parallel
    throw new LedgerError(
      "Couldn't access Ledger device. Is it being used in another tab?"
    )
  }

  /* istanbul ignore next: specific error rewrite */
  if (message.startsWith('Not supported')) {
    throw new LedgerError(
      "This browser doesn't support WebUSB yet. Update it to the latest version."
    )
  }

  /* istanbul ignore next: specific error rewrite */
  if (message.startsWith('No device selected')) {
    throw new LedgerError(
      "Couldn't find the Ledger. Check the Ledger is plugged in and unlocked."
    )
  }

  // throw unknown error
  throw err
}

const checkLedgerErrors = (response?: CommonResponse) => {
  if (!response) {
    return
  }

  const { error_message, device_locked } = response

  if (device_locked) {
    throw new LedgerError("Ledger's screensaver mode is on")
  }

  if (error_message.startsWith('TransportRaceCondition')) {
    throw new LedgerError('Finish previous action in Ledger')
  } else if (error_message.startsWith('DisconnectedDeviceDuringOperation')) {
    throw new LedgerError('Open the Initia app in the Ledger')
  }

  switch (error_message) {
    case 'U2F: Timeout':
      throw new LedgerError(
        "Couldn't find a connected and unlocked Ledger device"
      )

    case 'App does not seem to be open':
      throw new LedgerError('Open the Initia app in the Ledger')

    case 'Command not allowed':
      throw new LedgerError('Transaction rejected')

    case 'Transaction rejected':
      throw new LedgerError('User rejected the transaction')

    case 'Unknown Status Code: 26628':
      throw new LedgerError("Ledger's screensaver mode is on")

    case 'Instruction not supported':
      throw new LedgerError(
        'Check the Ledger is running latest version of Initia'
      )

    case 'No errors':
      break

    default:
      throw new LedgerError(error_message)
  }
}

const isWindows = (platform: string) => platform.indexOf('Win') > -1
const checkBrowser = (userAgent: string): string => {
  const ua = userAgent.toLowerCase()
  const isChrome = /chrome|crios/.test(ua) && !/edge|opr\//.test(ua)
  const isBrave = isChrome && !window.google

  if (!isChrome && !isBrave) {
    throw new LedgerError("This browser doesn't support Ledger devices")
  }

  return isChrome ? 'chrome' : 'brave'
}

async function createTransport(): Promise<Transport> {
  let transport: Transport

  checkBrowser(navigator.userAgent)

  if (isWindows(navigator.platform)) {
    // For Windows
    if (!navigator.hid) {
      throw new LedgerError(
        "This browser doesn't have HID enabled. Enable this feature by visiting: chrome://flags/#enable-experimental-web-platform-features"
      )
    }

    const { default: TransportWebHid } = await import(
      '@ledgerhq/hw-transport-webhid'
    )
    transport = await TransportWebHid.create(INTERACTION_TIMEOUT * 1000)
  } else {
    // For other than Windows
    const { default: TransportWebUsb } = await import(
      '@ledgerhq/hw-transport-webusb'
    )
    transport = await TransportWebUsb.create(INTERACTION_TIMEOUT * 1000)
  }
  return transport
}
