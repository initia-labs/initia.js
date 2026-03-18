import type Transport from '@ledgerhq/hw-transport'
import type { LoadConfig } from '@ledgerhq/hw-app-eth/lib/services/types.js'
import { Key, makeStdSignDoc, makeAminoSignBytes, buildStdFee } from 'initia.js'
import type { UnsignedTx } from 'initia.js'
import { LedgerError } from './error'
import type { LedgerApp } from './app'
import { EthereumApp, CosmosApp } from './app'

/** Initia/Ethereum coin type (BIP44) */
export const INIT_COIN_TYPE = 60
/** Cosmos coin type (BIP44) */
export const COSMOS_COIN_TYPE = 118

/**
 * Enum representing the type of Ledger application.
 */
export enum Kind {
  /** Ethereum application */
  Ethereum = 'Ethereum',
  /** Cosmos application */
  Cosmos = 'Cosmos',
}

/**
 * Options for LedgerKey creation.
 */
export interface LedgerKeyOptions {
  /** Account index for BIP44 derivation path (default: 0) */
  index?: number
  /** BIP44 coin type (default: 60) */
  coinType?: number
}

/** Compare two semver strings. Returns true if `a` is less than `b`. */
function semverLt(a: string, b: string): boolean {
  const parse = (v: string) => {
    const parts = v.split('.').map(n => parseInt(n, 10))
    if (parts.length < 3 || parts.some(n => isNaN(n))) {
      throw new LedgerError(`Invalid version string: '${v}'`)
    }
    return parts as [number, number, number]
  }
  const [aMaj, aMin, aPat] = parse(a)
  const [bMaj, bMin, bPat] = parse(b)
  if (aMaj !== bMaj) return aMaj < bMaj
  if (aMin !== bMin) return aMin < bMin
  return aPat < bPat
}

/**
 * Key implementation that uses a Ledger hardware wallet for transaction signing.
 *
 * Extends the v2 Key base class, supporting both Ethereum and Cosmos Ledger apps.
 * The public key is loaded from the device after initialization via `loadAccountDetails`.
 *
 * @example
 * ```typescript
 * // Ethereum app (default)
 * const key = await LedgerKey.createEthereumApp(transport)
 *
 * // Cosmos app
 * const key = await LedgerKey.createCosmosApp(transport)
 *
 * // Custom coin type
 * const key = await LedgerKey.createCosmosApp(transport, { coinType: 118 })
 *
 * // Sign a transaction
 * const sig = await key.sign(unsignedTx)
 * ```
 */
export class LedgerKey extends Key {
  /** Compressed secp256k1 public key (33 bytes), set by loadAccountDetails */
  publicKey!: Uint8Array

  /** Whether to use EVM-style (keccak256) address derivation */
  readonly isEth: boolean

  /** Bech32 prefix for address encoding */
  readonly bech32Prefix: string = 'init'

  private readonly path: number[]
  private app: LedgerApp
  private appKind: Kind

  /**
   * Creates a new LedgerKey instance.
   * Prefer factory methods (`createEthereumApp`, `createCosmosApp`) for fully initialized instances.
   */
  constructor(transport: Transport, appKind: Kind, options?: LedgerKeyOptions) {
    super()
    const index = options?.index ?? 0
    const defaultCoinType = appKind === Kind.Cosmos ? COSMOS_COIN_TYPE : INIT_COIN_TYPE
    const coinType = options?.coinType ?? defaultCoinType

    this.appKind = appKind
    this.isEth = appKind === Kind.Ethereum
    this.preferredSignMode = appKind === Kind.Ethereum ? 'eip191' : 'amino'
    this.path = [44, coinType, 0, 0, index]

    switch (appKind) {
      case Kind.Ethereum:
        this.app = new EthereumApp(transport)
        break
      case Kind.Cosmos:
        this.app = new CosmosApp(transport)
        break
      default:
        throw new LedgerError('unsupported application')
    }
  }

  /**
   * Creates and fully initializes a LedgerKey with the Ethereum app.
   * @param transport - Ledger transport instance
   * @param options - Optional: index, coinType
   */
  static async createEthereumApp(
    transport: Transport,
    options?: LedgerKeyOptions
  ): Promise<LedgerKey> {
    const key = new LedgerKey(transport, Kind.Ethereum, options)
    await key.initialize()
    return key
  }

  /**
   * Creates and fully initializes a LedgerKey with the Cosmos app.
   * @param transport - Ledger transport instance
   * @param options - Optional: index, coinType
   */
  static async createCosmosApp(
    transport: Transport,
    options?: LedgerKeyOptions
  ): Promise<LedgerKey> {
    const key = new LedgerKey(transport, Kind.Cosmos, options)
    await key.initialize()
    return key
  }

  /**
   * Initializes the key by checking version compatibility and loading account details.
   * @throws LedgerError if the installed Ledger app is below the minimum required version
   */
  private async initialize(): Promise<void> {
    const version = await this.app.getVersion()
    const minVersion = this.app.getMinimumRequiredVersion()
    if (semverLt(version, minVersion)) {
      const appName = this.appKind === Kind.Ethereum ? 'Ethereum' : 'Cosmos'
      throw new LedgerError(`Outdated version: Update Ledger ${appName} App to the latest version`)
    }
    await this.loadAccountDetails()
  }

  /**
   * Loads account details (public key) from the Ledger device.
   * @returns This LedgerKey instance
   */
  public async loadAccountDetails(): Promise<LedgerKey> {
    this.publicKey = await this.app.getPublicKey(this.getPath(), false)
    return this
  }

  /**
   * Gets the BIP44 derivation path as a string.
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
   * Gets the type of Ledger application in use.
   */
  public getApplicationKind(): Kind {
    return this.appKind
  }

  /**
   * Gets the Ledger application instance.
   */
  public getApplication(): LedgerApp {
    return this.app
  }

  /**
   * Sets the load configuration for the Ledger application (Ethereum only).
   */
  public setLoadConfig(loadConfig: LoadConfig): void {
    this.app.setLoadConfig(loadConfig)
  }

  /**
   * Gets the Ledger transport instance.
   */
  public getTransport(): Transport {
    return this.app.transport
  }

  /**
   * Gets the application configuration from the device.
   */
  public async getAppConfiguration(): Promise<unknown> {
    return this.app.getAppConfiguration()
  }

  /**
   * Shows the address and public key on the Ledger device for user verification.
   */
  public async showAddressAndPubKey(): Promise<void> {
    await this.app.getAddress(this.getPath(), true)
  }

  // ========== Supported sign modes ==========

  /**
   * Validates that the requested sign mode is supported by this Ledger app.
   *
   * - Ethereum app: only 'eip191' (uses signPersonalMessage internally)
   * - Cosmos app: only 'amino' (uses amino JSON signing)
   * - 'direct' mode is not supported by either Ledger app
   */
  protected override async _signTx(tx: UnsignedTx): Promise<Uint8Array> {
    const supported = this.appKind === Kind.Ethereum ? 'eip191' : 'amino'
    if (tx.signMode !== supported) {
      throw new LedgerError(
        `LedgerKey (${this.appKind} app) only supports '${supported}' sign mode, got '${tx.signMode}'`
      )
    }

    // Ethereum app + eip191: build amino sign bytes and use signPersonal directly.
    // This bypasses Key._signTx's makeEIP191SignBytes -> signWithKeccak256 path,
    // which relies on the fragile indexOf(0x7b) heuristic in EthereumApp.
    if (tx.signMode === 'eip191') {
      const stdSignDoc = makeStdSignDoc(
        tx.msgs.map(m => m.toAmino()),
        buildStdFee(tx),
        tx.chainId,
        tx.memo,
        tx.accountNumber,
        tx.sequence
      )
      const aminoBytes = makeAminoSignBytes(stdSignDoc)
      return this.signPersonal(aminoBytes)
    }

    // Cosmos app + amino: use the standard Key._signTx path
    return super._signTx(tx)
  }

  // ========== Key abstract method implementations ==========

  /**
   * Signs raw bytes using the Ledger app (Cosmos: amino JSON, Ethereum: not directly used).
   */
  protected async signRaw(message: Uint8Array): Promise<Uint8Array> {
    return this.app.sign(this.getPath(), message)
  }

  /**
   * Signs data with EIP-191 personal sign.
   * For Ethereum app: bypasses Key.signPersonal's prefix cycle by delegating
   * directly to EthereumApp.signPersonal (Ledger handles prefix internally).
   * For Cosmos app: falls back to Key.signPersonal (standard prefix + signRaw).
   */
  async signPersonal(data: Uint8Array): Promise<Uint8Array> {
    if (this.appKind === Kind.Ethereum) {
      return (this.app as EthereumApp).signPersonal(this.getPath(), data)
    }
    return super.signPersonal(data)
  }

  /**
   * Signs a message using EIP-191 personal sign via the Ledger Ethereum app.
   * The payload must be EIP-191 prefixed amino JSON bytes.
   */
  async signWithKeccak256(message: Uint8Array): Promise<Uint8Array> {
    return this.app.signWithKeccak256(this.getPath(), message)
  }

  /**
   * Signs a text message.
   * @param payload - Text or bytes to sign
   * @returns Signature bytes
   */
  async signText(payload: string | Uint8Array): Promise<Uint8Array> {
    return this.app.signText(this.getPath(), payload)
  }
}
