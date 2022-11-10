import { APIRequester } from './APIRequester';
import {
  AuthAPI,
  BankAPI,
  DistributionAPI,
  FeeGrantAPI,
  GovAPI,
  MintAPI,
  AuthzAPI,
  SlashingAPI,
  StakingAPI,
  TendermintAPI,
  TxAPI,
  UpgradeAPI,
  MoveAPI,
  IbcTransferAPI,
  IbcAPI,
} from './api';
import { LCDUtils } from './LCDUtils';
import { Wallet } from './Wallet';
import { Coins } from '../../core/Coins';
import { Key } from '../../key';

export interface LCDClientConfig {
  /**
   * The base URL to which LCD requests will be made.
   */
  URL: string;

  /**
   * Chain ID of the blockchain to connect to.
   */
  chainID: string;

  /**
   * Coins representing the default gas prices to use for fee estimation.
   */
  gasPrices?: Coins.Input;

  /**
   * Number presenting the default gas adjustment value to use for fee estimation.
   */
  gasAdjustment?: string;
}

const DEFAULT_LCD_OPTIONS: Partial<LCDClientConfig> = {
  gasAdjustment: '1.75',
};

const DEFAULT_GAS_PRICES_BY_CHAIN_ID: { [key: string]: Coins.Input } = {
  default: {
    uinit: 0.15,
  },
};

/**
 * An object repesenting a connection to a initiad node running the Lite Client Daemon (LCD)
 * server, a REST server providing access to a node.
 *
 * ### Example
 *
 * ```ts
 * import { LCDClient, Coin } from 'initia.js';
 *
 * const initia = new LCDClient({
 *    URL: "https://lcd.initia.dev",
 *    chainID: "testnet"
 * });
 * ```
 */

export class LCDClient {
  public config: LCDClientConfig;
  public apiRequester: APIRequester;

  // API access
  public auth: AuthAPI;
  public bank: BankAPI;
  public distribution: DistributionAPI;
  public feeGrant: FeeGrantAPI;
  public gov: GovAPI;
  public mint: MintAPI;
  public authz: AuthzAPI;
  public slashing: SlashingAPI;
  public staking: StakingAPI;
  public tendermint: TendermintAPI;
  public tx: TxAPI;
  public upgrade: UpgradeAPI;
  public move: MoveAPI;
  public ibc: IbcAPI;
  public ibcTransfer: IbcTransferAPI;
  public utils: LCDUtils;

  /**
   * Creates a new LCD client with the specified configuration.
   *
   * @param config LCD configuration
   */
  constructor(config: LCDClientConfig) {
    this.config = {
      ...DEFAULT_LCD_OPTIONS,
      gasPrices:
        DEFAULT_GAS_PRICES_BY_CHAIN_ID[config.chainID] ||
        DEFAULT_GAS_PRICES_BY_CHAIN_ID['default'],
      ...config,
    };

    this.apiRequester = new APIRequester(this.config.URL);

    // instantiate APIs
    this.auth = new AuthAPI(this.apiRequester);
    this.bank = new BankAPI(this.apiRequester);
    this.distribution = new DistributionAPI(this.apiRequester);
    this.feeGrant = new FeeGrantAPI(this.apiRequester);
    this.gov = new GovAPI(this.apiRequester);
    this.mint = new MintAPI(this.apiRequester);
    this.authz = new AuthzAPI(this.apiRequester);
    this.slashing = new SlashingAPI(this.apiRequester);
    this.staking = new StakingAPI(this.apiRequester);
    this.tendermint = new TendermintAPI(this.apiRequester);
    this.move = new MoveAPI(this.apiRequester);
    this.ibc = new IbcAPI(this.apiRequester);
    this.ibcTransfer = new IbcTransferAPI(this.apiRequester);
    this.tx = new TxAPI(this);
    this.upgrade = new UpgradeAPI(this.apiRequester);
    this.utils = new LCDUtils(this);
  }

  /** Creates a new wallet with the Key. */
  public wallet(key: Key): Wallet {
    return new Wallet(this, key);
  }
}
