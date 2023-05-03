import { APIRequester } from './APIRequester';
import {
  AuthAPI,
  BankAPI,
  DistributionAPI,
  FeeGrantAPI,
  GovAPI,
  RewardAPI,
  AuthzAPI,
  SlashingAPI,
  MstakingAPI,
  TendermintAPI,
  TxAPI,
  UpgradeAPI,
  MoveAPI,
  IbcTransferAPI,
  IbcNftAPI,
  IbcSftAPI,
  IbcAPI,
  InterTxAPI,
} from './api';
import { LCDUtils } from './LCDUtils';
import { Wallet } from './Wallet';
import { Coins } from '../../core/Coins';
import { Key } from '../../key';

export interface LCDClientConfig {
  /**
   * Chain ID of the blockchain to connect to.
   */
  chainId?: string;

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
 * import { LCDClient } from 'initia.js';
 *
 * const initia = new LCDClient("https://stone-rest.initia.tech", {
 *    chainId: "testnet"
 * });
 * ```
 */

export class LCDClient {
  public URL: string;
  public config: LCDClientConfig;
  public apiRequester: APIRequester;

  // API access
  public auth: AuthAPI;
  public bank: BankAPI;
  public distribution: DistributionAPI;
  public feeGrant: FeeGrantAPI;
  public gov: GovAPI;
  public reward: RewardAPI;
  public authz: AuthzAPI;
  public slashing: SlashingAPI;
  public mstaking: MstakingAPI;
  public tendermint: TendermintAPI;
  public tx: TxAPI;
  public upgrade: UpgradeAPI;
  public move: MoveAPI;
  public ibc: IbcAPI;
  public ibcTransfer: IbcTransferAPI;
  public ibcNft: IbcNftAPI;
  public ibcSft: IbcSftAPI;
  public interTx: InterTxAPI;
  public utils: LCDUtils;

  /**
   * Creates a new LCD client with the specified configuration.
   *
   * @param config LCD configuration
   */
  constructor(
    URL: string,
    config?: LCDClientConfig,
    apiRequester?: APIRequester
  ) {
    this.URL = URL;
    this.config = {
      ...DEFAULT_LCD_OPTIONS,
      gasPrices:
        (config?.chainId && DEFAULT_GAS_PRICES_BY_CHAIN_ID[config.chainId]) ??
        DEFAULT_GAS_PRICES_BY_CHAIN_ID['default'],
      ...config,
    };
    this.apiRequester = apiRequester ?? new APIRequester(this.URL);

    // instantiate APIs
    this.auth = new AuthAPI(this.apiRequester);
    this.bank = new BankAPI(this.apiRequester);
    this.distribution = new DistributionAPI(this.apiRequester);
    this.feeGrant = new FeeGrantAPI(this.apiRequester);
    this.gov = new GovAPI(this.apiRequester);
    this.reward = new RewardAPI(this.apiRequester);
    this.authz = new AuthzAPI(this.apiRequester);
    this.slashing = new SlashingAPI(this.apiRequester);
    this.mstaking = new MstakingAPI(this.apiRequester);
    this.tendermint = new TendermintAPI(this.apiRequester);
    this.move = new MoveAPI(this.apiRequester);
    this.ibc = new IbcAPI(this.apiRequester);
    this.ibcTransfer = new IbcTransferAPI(this.apiRequester);
    this.ibcNft = new IbcNftAPI(this.apiRequester);
    this.ibcSft = new IbcSftAPI(this.apiRequester);
    this.tx = new TxAPI(this);
    this.upgrade = new UpgradeAPI(this.apiRequester);
    this.interTx = new InterTxAPI(this.apiRequester);
    this.utils = new LCDUtils(this);
  }

  /** Creates a new wallet with the Key. */
  public wallet(key: Key): Wallet {
    return new Wallet(this, key);
  }
}
