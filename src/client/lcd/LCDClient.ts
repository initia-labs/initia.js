import { APIRequester } from './APIRequester';
import {
  AuctionAPI,
  AuthAPI,
  AuthzAPI,
  BankAPI,
  DistributionAPI,
  EvidenceAPI,
  EvmAPI,
  FeeGrantAPI,
  ForwardingAPI,
  GovAPI,
  GroupAPI,
  IbcAPI,
  IbcFetchpriceAPI,
  IbcHooksAPI,
  IbcNftAPI,
  IbcTransferAPI,
  IbcPermAPI,
  InterTxAPI,
  MoveAPI,
  MstakingAPI,
  OpchildAPI,
  OphostAPI,
  OracleAPI,
  RewardAPI,
  SlashingAPI,
  TendermintAPI,
  TokenfactoryAPI,
  TxAPI,
  UpgradeAPI,
  WasmAPI,
} from './api';
import { Wallet } from './Wallet';
import { Coins } from '../../core';
import { Key } from '../../key';
import { AxiosRequestConfig } from 'axios';

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
  public auction: AuctionAPI;
  public auth: AuthAPI;
  public authz: AuthzAPI;
  public bank: BankAPI;
  public distribution: DistributionAPI;
  public evidence: EvidenceAPI;
  public evm: EvmAPI;
  public feeGrant: FeeGrantAPI;
  public forwarding: ForwardingAPI;
  public gov: GovAPI;
  public group: GroupAPI;
  public ibc: IbcAPI;
  public ibcFetchprice: IbcFetchpriceAPI;
  public ibcHooks: IbcHooksAPI;
  public ibcNft: IbcNftAPI;
  public ibcTransfer: IbcTransferAPI;
  public ibcPerm: IbcPermAPI;
  public interTx: InterTxAPI;
  public move: MoveAPI;
  public mstaking: MstakingAPI;
  public opchild: OpchildAPI;
  public ophost: OphostAPI;
  public oracle: OracleAPI;
  public reward: RewardAPI;
  public slashing: SlashingAPI;
  public tendermint: TendermintAPI;
  public tokenfactory: TokenfactoryAPI;
  public tx: TxAPI;
  public upgrade: UpgradeAPI;
  public wasm: WasmAPI;

  /**
   * Creates a new LCD client with the specified configuration.
   *
   * @param config LCD configuration
   */
  constructor(
    URL: string,
    config?: LCDClientConfig,
    axiosConfig?: AxiosRequestConfig
  ) {
    this.URL = URL;
    this.config = {
      ...DEFAULT_LCD_OPTIONS,
      gasPrices:
        (config?.chainId && DEFAULT_GAS_PRICES_BY_CHAIN_ID[config.chainId]) ??
        DEFAULT_GAS_PRICES_BY_CHAIN_ID['default'],
      ...config,
    };
    this.apiRequester = new APIRequester(this.URL, axiosConfig);

    // instantiate APIs
    this.auction = new AuctionAPI(this.apiRequester);
    this.auth = new AuthAPI(this.apiRequester);
    this.authz = new AuthzAPI(this.apiRequester);
    this.bank = new BankAPI(this.apiRequester);
    this.distribution = new DistributionAPI(this.apiRequester);
    this.evidence = new EvidenceAPI(this.apiRequester);
    this.evm = new EvmAPI(this.apiRequester);
    this.feeGrant = new FeeGrantAPI(this.apiRequester);
    this.forwarding = new ForwardingAPI(this.apiRequester);
    this.gov = new GovAPI(this.apiRequester);
    this.group = new GroupAPI(this.apiRequester);
    this.ibc = new IbcAPI(this.apiRequester);
    this.ibcFetchprice = new IbcFetchpriceAPI(this.apiRequester);
    this.ibcHooks = new IbcHooksAPI(this.apiRequester);
    this.ibcNft = new IbcNftAPI(this.apiRequester);
    this.ibcTransfer = new IbcTransferAPI(this.apiRequester);
    this.ibcPerm = new IbcPermAPI(this.apiRequester);
    this.interTx = new InterTxAPI(this.apiRequester);
    this.move = new MoveAPI(this.apiRequester);
    this.mstaking = new MstakingAPI(this.apiRequester);
    this.opchild = new OpchildAPI(this.apiRequester);
    this.ophost = new OphostAPI(this.apiRequester);
    this.oracle = new OracleAPI(this.apiRequester);
    this.reward = new RewardAPI(this.apiRequester);
    this.slashing = new SlashingAPI(this.apiRequester);
    this.tendermint = new TendermintAPI(this.apiRequester);
    this.tokenfactory = new TokenfactoryAPI(this.apiRequester);
    this.tx = new TxAPI(this);
    this.upgrade = new UpgradeAPI(this.apiRequester);
    this.wasm = new WasmAPI(this.apiRequester);
  }

  /** Creates a new wallet with the Key. */
  public wallet(key: Key): Wallet {
    return new Wallet(this, key);
  }
}
