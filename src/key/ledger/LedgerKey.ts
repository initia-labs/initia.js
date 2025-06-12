import * as semver from 'semver'
import Transport from '@ledgerhq/hw-transport'
import { AccAddress, SignatureV2, SignDoc } from '../..'
import { Key } from '../Key'
import { INIT_COIN_TYPE } from '../MnemonicKey'
import { LedgerError } from '.'
import { LoadConfig } from '@ledgerhq/hw-app-eth/lib/services/types'
import { LedgerApp, EthereumApp, CosmosApp } from './app'

const INTERACTION_TIMEOUT = 120
const COSMOS_COIN_TYPE = 118

declare global {
  interface Window {
    google: any
  }
  interface Navigator {
    hid: any
  }
}

/**
 * Enum representing the type of Ledger application
 */
export enum Kind {
  /** Ethereum application */
  Ethereum = 'Ethereum',
  /** Cosmos application */
  Cosmos = 'Cosmos',
}

/**
 * Key implementation that uses Ledger hardware wallet for transaction signing.
 * This class extends the base Key class and provides Ledger-specific functionality.
 *
 * Features:
 * - Supports both Ethereum and Cosmos applications
 * - Handles BIP44 derivation paths
 * - Manages device connection and initialization
 * - Provides methods for transaction signing and address verification
 */
export class LedgerKey extends Key {
  private readonly path: number[]
  private app: LedgerApp
  private appKind

  /**
   * Creates a new LedgerKey instance
   * @param transport - Ledger transport instance
   * @param index - Account index for BIP44 derivation path
   * @param appKind - Type of Ledger application (Ethereum or Cosmos)
   */
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
   * Gets the Initia account address
   * @returns Bech32 encoded address with 'init' as human-readable part
   * @throws Error if Ledger is not initialized
   */
  public get accAddress(): AccAddress {
    if (!this.publicKey) {
      throw new Error('Ledger is uninitialized. Initialize it first.')
    }

    return this.publicKey.address()
  }

  /**
   * Creates and initializes a new LedgerKey instance
   * @param transport - Optional Ledger transport instance
   * @param index - Account index for BIP44 derivation path
   * @param appKind - Type of Ledger application (Ethereum or Cosmos)
   * @returns Promise resolving to initialized LedgerKey instance
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
    await key.initialize().catch(handleConnectError)
    return key
  }

  /**
   * Initializes the LedgerKey by checking version and loading account details
   * @throws LedgerError if the Ledger app version is outdated
   */
  private async initialize() {
    const version = await this.app.getVersion()
    if (semver.lt(version, this.app.getMininumRequiredVersion())) {
      throw new LedgerError(
        `Outdated version: Update Ledger ${this.appKind === Kind.Ethereum ? 'Ethereum' : 'Cosmos'} App to the latest version`
      )
    }
    await this.loadAccountDetails()
  }

  /**
   * Gets the type of Ledger application
   * @returns Kind enum value indicating the application type
   */
  public getApplicationKind(): Kind {
    return this.appKind
  }

  /**
   * Gets the Ledger application instance
   * @returns LedgerApp instance
   */
  public getApplication(): LedgerApp {
    return this.app
  }

  /**
   * Sets the load configuration for the Ledger application
   * @param loadConfig - LoadConfig object to set
   * @throws LedgerError if the Ledger app is not initialized
   */
  public setLoadConfig(loadConfig: LoadConfig): void {
    if (!this.app) {
      throw new LedgerError('Ledger app is not initialized')
    }
    this.app.setLoadConfig(loadConfig)
  }

  /**
   * Gets the BIP44 derivation path as a string
   * @returns Path string in BIP44 format
   * @throws LedgerError if the application kind is invalid
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
   * Loads account details (address and public key) from the Ledger device
   * @returns Promise resolving to this LedgerKey instance
   */
  public async loadAccountDetails(): Promise<LedgerKey> {
    this.publicKey = await this.app.getPublicKey(this.getPath(), false)
    return this
  }

  /** Signs a message with the LedgerKey. This method is identical to `signWithKeccak256`, but it is used for legacy compatibility. */
  public async sign(payload: Buffer): Promise<Buffer> {
    return await this.app.sign(this.getPath(), payload)
  }

  /**
   * Signs a message using Keccak256 hash
   * @param payload - Message to sign
   * @returns Promise resolving to signature buffer
   */
  public async signWithKeccak256(payload: Buffer): Promise<Buffer> {
    return await this.app.signWithKeccak256(this.getPath(), payload)
  }

  /**
   * Creates a signature for a transaction
   * @param _tx - SignDoc to sign
   * @throws Error as direct sign mode is not supported
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async createSignature(_tx: SignDoc): Promise<SignatureV2> {
    throw new Error('direct sign mode is not supported')
  }

  /**
   * Signs a text message
   * @param payload - Text or buffer to sign
   * @returns Promise resolving to signature buffer
   */
  public async signText(payload: string | Buffer): Promise<Buffer> {
    return this.app.signText(this.getPath(), payload)
  }

  /**
   * Gets the Ledger application instance
   * @returns LedgerApp instance
   * @throws LedgerError if the Ledger app is not initialized
   */
  public getApp(): LedgerApp {
    if (!this.app) {
      throw new LedgerError('Ledger app is not initialized')
    }
    return this.app
  }

  /**
   * Gets the Ledger application configuration
   * @returns Promise resolving to app configuration object
   * @throws LedgerError if the Ledger app is not initialized
   */
  public async getAppConfiguration(): Promise<any> {
    return await this.app.getAppConfiguration()
  }

  /**
   * Shows address and public key on the Ledger device for verification
   * This will prompt the user to confirm the address on the device
   */
  public async showAddressAndPubKey() {
    await this.app.getAddress(this.getPath(), true)
  }

  /**
   * Gets the Ledger transport instance
   * @returns Transport instance
   */
  getTransport(): Transport {
    return this.app.transport
  }

  /**
   * Creates a new LedgerKey instance for Ethereum application
   * @param transport - Optional Ledger transport instance
   * @param index - Account index for BIP44 derivation path
   * @returns Promise resolving to initialized LedgerKey instance
   */
  static async createEthereumApp(
    transport?: Transport,
    index = 0
  ): Promise<LedgerKey> {
    return await LedgerKey.create(transport, index, Kind.Ethereum)
  }

  /**
   * Creates a new LedgerKey instance for Cosmos application
   * @param transport - Optional Ledger transport instance
   * @param index - Account index for BIP44 derivation path
   * @returns Promise resolving to initialized LedgerKey instance
   */
  static async createCosmosApp(
    transport?: Transport,
    index = 0
  ): Promise<LedgerKey> {
    return await LedgerKey.create(transport, index, Kind.Cosmos)
  }
}

/**
 * Handles connection errors from Ledger device
 * @param err - Error object
 * @throws LedgerError with appropriate error message
 */
const handleConnectError = (err: Error) => {
  const message = err.message.trim()

  if (message.startsWith('The device is already open')) {
    // ignore this error
    return
  }

  if (err.name === 'TransportOpenUserCancelled') {
    throw new LedgerError(
      "Couldn't find the Ledger. Check the Ledger is plugged in and unlocked."
    )
  }

  /* istanbul ignore next: specific error rewrite */
  if (message.startsWith('No WebUSB interface found for the Ledger device')) {
    throw new LedgerError(
      "Couldn't connect to a Ledger device. Use Ledger Live to upgrade the Ledger firmware to version to latest."
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

/**
 * Creates a new Ledger transport instance
 * @returns Promise resolving to Transport instance
 */
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
