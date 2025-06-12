import * as semver from 'semver'
import Transport from '@ledgerhq/hw-transport'
import { AccAddress, SignatureV2, SignDoc } from '../..'
import { Key } from '../Key'
import { INIT_COIN_TYPE } from '../MnemonicKey'
import { LedgerError } from '.'
import { LoadConfig } from '@ledgerhq/hw-app-eth/lib/services/types'
import { LedgerApp, EthereumApp, CosmosApp } from './app'

const INTERACTION_TIMEOUT = 120
const REQUIRED_APP_VERSION = '1.0.0'
const COSMOS_COIN_TYPE = 118

declare global {
  interface Window {
    google: any
  }
  interface Navigator {
    hid: any
  }
}

export enum Kind {
  Ethereum = 'Ethereum',
  Cosmos = 'Cosmos',
}

/**
 * Key implementation that uses Ledger to sign transactions. Keys should be registered
 * in Ledger device
 */
export class LedgerKey extends Key {
  private readonly path: number[]
  private app: LedgerApp
  private appKind

  constructor(transport: Transport, index = 0, appKind = Kind.Ethereum) {
    super()
    this.appKind = appKind

    switch (appKind) {
      case Kind.Ethereum:
        this.app = new EthereumApp(transport)
        this.path = [44, INIT_COIN_TYPE, 0, 0, index]
        break
      case Kind.Cosmos:
        this.app = new CosmosApp(transport)
        this.path = [44, COSMOS_COIN_TYPE, 0, 0, index]
        break
      default:
        throw new LedgerError('unsupported application')
    }
  }

  /**
   *
   * Initia account address. return bech32 address with `init' as hrp
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
    index = 0,
    appKind = Kind.Ethereum
  ): Promise<LedgerKey> {
    if (!transport) {
      transport = await createTransport()
    }

    const key = new LedgerKey(transport, index, appKind)

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
    const version = await this.app.getVersion()
    if (semver.lt(version, REQUIRED_APP_VERSION)) {
      throw new LedgerError(
        `Outdated version: Update Ledger ${this.appKind === Kind.Ethereum ? 'Ethereum' : 'Cosmos'} App to the latest version`
      )
    }
    await this.loadAccountDetails()
  }

  public getApplicationKind(): Kind {
    return this.appKind
  }

  public getApplication(): LedgerApp {
    return this.app
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
    switch (this.appKind) {
      case Kind.Ethereum:
        return `${this.path[0]}'/${this.path[1]}'/${this.path[2]}'/${this.path[3]}/${this.path[4]}`
      case Kind.Cosmos:
        return `m/${this.path[0]}'/${this.path[1]}'/${this.path[2]}'/${this.path[3]}/${this.path[4]}`
      default:
        throw new LedgerError('invalid kind of app')
    }
  }

  /**
   * get Address and Pubkey from Ledger
   */
  public async loadAccountDetails(): Promise<LedgerKey> {
    this.publicKey = await this.app.getPublicKey(this.getPath(), false)
    return this
  }

  /** Signs a message with the LedgerKey. This method is identical to `signWithKeccak256`, but it is used for legacy compatibility. */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async sign(payload: Buffer): Promise<Buffer> {
    return await this.app.sign(this.getPath(), payload)
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async signWithKeccak256(payload: Buffer): Promise<Buffer> {
    /* no need to check if publicKey is set here, as it is checked in the signTransaction method 
    if (!this.publicKey) {
      await this.loadAccountDetails()
    }
    */
    return await this.app.signWithKeccak256(this.getPath(), payload)
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

    return this.app.signText(this.getPath(), payload)
  }

  /**
   *
   * @returns Ledger app instance.
   */
  public getApp(): LedgerApp {
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
  public async getAppConfiguration(): Promise<any> {
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

  getTransport(): Transport {
    return this.app.transport
  }

  static async createEthereumApp(
    transport?: Transport,
    index = 0
  ): Promise<LedgerKey> {
    return await LedgerKey.create(transport, index, Kind.Ethereum)
  }

  static async createCosmosApp(
    transport?: Transport,
    index = 0
  ): Promise<LedgerKey> {
    return await LedgerKey.create(transport, index, Kind.Cosmos)
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
