import { BaseAPI } from './BaseAPI'
import {
  Msg,
  Tx,
  Coins,
  TxInfo,
  TxBody,
  AuthInfo,
  Fee,
  PublicKey,
  num,
  TxLog,
  Event,
  Denom,
  Coin,
} from '../../../core'
import { hashToHex } from '../../../util'
import { RESTClient } from '../RESTClient'
import { APIParams, Pagination, PaginationOptions } from '../APIRequester'
import { BroadcastMode } from '@initia/initia.proto/cosmos/tx/v1beta1/service'

interface Wait {
  height: number
  txhash: string
  raw_log: string
  gas_wanted: number
  gas_used: number
  logs: TxLog[]
  timestamp: string
}

interface Block extends Wait {
  info: string
  data: string
}

interface Sync {
  height: number
  txhash: string
  raw_log: string
}

interface Async {
  height: number
  txhash: string
}

export type TxBroadcastResult<
  B extends Wait | Block | Sync | Async,
  C extends TxSuccess | TxError | object,
> = B & C

export interface TxSuccess {
  logs: TxLog[]
}

export interface TxError {
  code: number | string
  codespace?: string
}

export type WaitTxBroadcastResult = TxBroadcastResult<Wait, TxSuccess | TxError>
export type BlockTxBroadcastResult = TxBroadcastResult<
  Block,
  TxSuccess | TxError
>
export type SyncTxBroadcastResult = TxBroadcastResult<Sync, TxError | object>
export type AsyncTxBroadcastResult = TxBroadcastResult<Async, object>

export function isTxError<
  T extends TxBroadcastResult<B, C>,
  B extends Wait | Block | Sync,
  C extends TxSuccess | TxError | object,
>(x: T): x is T & TxBroadcastResult<B, TxError> {
  return (
    (x as T & TxError).code !== undefined &&
    (x as T & TxError).code !== 0 &&
    (x as T & TxError).code !== '0'
  )
}

export namespace BlockTxBroadcastResult {
  export interface Data {
    height: string
    txhash: string
    raw_log: string
    gas_wanted: string
    gas_used: string
    logs: TxLog.Data[]
    code: number | string
    codespace: string
    info: string
    data: string
    timestamp: string
    events: Event[]
  }
}

export namespace AsyncTxBroadcastResult {
  export type Data = Pick<BlockTxBroadcastResult.Data, 'height' | 'txhash'>
}

export namespace SyncTxBroadcastResult {
  export type Data = Pick<
    BlockTxBroadcastResult.Data,
    'height' | 'txhash' | 'raw_log' | 'code' | 'codespace'
  >
}

export interface SignerOptions {
  address: string
  sequenceNumber?: number
  publicKey?: PublicKey
}

export interface SignerData {
  sequenceNumber: number
  publicKey?: PublicKey
}

export interface CreateTxOptions {
  msgs: Msg[]
  fee?: Fee
  memo?: string
  gas?: string
  gasPrices?: Coins.Input
  gasAdjustment?: number | string
  feeDenoms?: string[]
  timeoutHeight?: number
}

export interface TxResult {
  tx: TxInfo
}

export namespace TxResult {
  export interface Data {
    tx: Tx.Data
    tx_response: TxInfo.Data
  }
}

export interface TxSearchResult {
  pagination: Pagination
  total: number
  txs: TxInfo[]
}

export namespace TxSearchResult {
  export interface Data {
    txs: Tx.Data[]
    tx_responses: TxInfo.Data[]
    pagination: Pagination
    total: string
  }
}

export class SimulateResponse {
  constructor(
    public gas_info: { gas_wanted: number; gas_used: number },
    public result: {
      data: string
      log: string
      events: { type: string; attributes: { key: string; value: string }[] }[]
    }
  ) {}

  public static fromData(data: SimulateResponse.Data): SimulateResponse {
    return new SimulateResponse(
      {
        gas_wanted: parseInt(data.gas_info.gas_wanted),
        gas_used: parseInt(data.gas_info.gas_used),
      },
      data.result
    )
  }
}

export namespace SimulateResponse {
  export interface Data {
    gas_info: {
      gas_wanted: string
      gas_used: string
    }
    result: {
      data: string
      log: string
      events: { type: string; attributes: { key: string; value: string }[] }[]
    }
  }
}

export type TxSearchOp = '=' | '<' | '<=' | '>' | '>=' | 'CONTAINS' | 'EXISTS'
export interface TxSearchQuery {
  key: string
  value: string
  op?: TxSearchOp
}
export interface TxSearchOptions extends PaginationOptions {
  page: number
  query: TxSearchQuery[]
}

export class TxAPI extends BaseAPI {
  constructor(public rest: RESTClient) {
    super(rest.apiRequester)
  }

  /**
   * Query a transaction on the blockchain, addressed by its hash.
   * @param tx_hash transaction's hash
   */
  public async txInfo(
    tx_hash: string,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<TxInfo> {
    return this.c
      .getRaw<TxResult.Data>(
        `/cosmos/tx/v1beta1/txs/${tx_hash}`,
        params,
        headers
      )
      .then((v) => TxInfo.fromData(v.tx_response))
  }

  /**
   * Builds a [[StdSignMsg]] that is ready to be signed by a [[Key]]. The appropriate
   * account number and sequence will be fetched live from the blockchain and added to
   * the resultant [[StdSignMsg]]. If no fee is provided, fee will be automatically
   * estimated using the parameters, simulated using a "dummy fee" with sourceAddress's
   * nonzero denominations in its balance.
   * @param sourceAddress account address of signer
   * @param options TX generation options
   */
  public async create(
    signers: SignerOptions[],
    options: CreateTxOptions
  ): Promise<Tx> {
    let { fee } = options
    const { msgs, memo, timeoutHeight } = options

    const signerDatas: SignerData[] = []
    for (const signer of signers) {
      let sequenceNumber = signer.sequenceNumber
      let publicKey = signer.publicKey

      if (sequenceNumber === undefined || !publicKey) {
        const account = await this.rest.auth.accountInfo(signer.address)
        if (sequenceNumber === undefined) {
          sequenceNumber = account.getSequenceNumber()
        }

        if (!publicKey) {
          publicKey = account.getPublicKey()
        }
      }

      signerDatas.push({
        sequenceNumber,
        publicKey,
      })
    }

    if (fee === undefined) {
      fee = await this.rest.tx.estimateFee(signerDatas, options)
    }

    return new Tx(
      new TxBody(msgs, memo ?? '', timeoutHeight ?? 0),
      new AuthInfo([], fee),
      []
    )
  }

  /**
   * Query transactions on the blockchain for the block height.
   * If height is undefined, gets the transactions for the latest block.
   * @param height block height
   */
  public async txInfosByHeight(height: number | undefined): Promise<TxInfo[]> {
    const blockInfo = await this.rest.tendermint.blockInfo(height)
    const { txs } = blockInfo.block.data
    if (!txs) {
      return []
    } else {
      const txhashes = txs.map((txdata) => hashToHex(txdata))
      const txInfos: TxInfo[] = []

      for (const txhash of txhashes) {
        txInfos.push(await this.txInfo(txhash))
      }

      return txInfos
    }
  }

  /**
   * Estimate the transaction's fee by simulating it within the node.
   * @param signers signer data
   * @param options options for fee estimation
   */
  public async estimateFee(
    signers: SignerData[],
    options: CreateTxOptions
  ): Promise<Fee> {
    if (!this.rest.config.gasPrices) {
      this.rest.config.gasPrices = await this.rest.gasPrices()
    }

    const gasPrices = options.gasPrices ?? this.rest.config.gasPrices
    const gasAdjustment =
      options.gasAdjustment ?? this.rest.config.gasAdjustment
    const feeDenoms = options.feeDenoms ?? ['uinit']
    let gas = options.gas
    let gasPricesCoins: Coins | undefined

    if (gasPrices) {
      gasPricesCoins = new Coins(gasPrices)

      if (feeDenoms) {
        const gasPricesCoinsFiltered = gasPricesCoins.filter((c) =>
          feeDenoms.includes(c.denom)
        )

        if (gasPricesCoinsFiltered.toArray().length > 0) {
          gasPricesCoins = gasPricesCoinsFiltered
        }
      }
    }

    const txBody = new TxBody(options.msgs, options.memo ?? '')
    const authInfo = new AuthInfo([], new Fee(0, new Coins()))
    const tx = new Tx(txBody, authInfo, [])

    // fill empty signature
    tx.appendEmptySignatures(signers)

    // simulate gas
    if (!gas || gas === 'auto' || gas === '0') {
      gas = await this.estimateGas(tx, { gasAdjustment })
    }

    const feeAmount = gasPricesCoins
      ? gasPricesCoins.mul(gas).toIntCeilCoins()
      : '0uinit'

    return new Fee(parseInt(gas), feeAmount, '', '')
  }

  public async estimateGas(
    tx: Tx,
    options?: {
      gasAdjustment?: number | string
      signers?: SignerData[]
    },
    headers: Record<string, string> = {}
  ): Promise<string> {
    const gasAdjustment =
      options?.gasAdjustment ?? this.rest.config.gasAdjustment

    // append empty signatures if there's no signatures in tx
    let simTx: Tx = tx
    if (tx.signatures.length <= 0) {
      if (!(options && options.signers && options.signers.length > 0)) {
        throw new Error('cannot append signature')
      }
      const authInfo = new AuthInfo([], new Fee(0, new Coins()))
      simTx = new Tx(tx.body, authInfo, [])
      simTx.appendEmptySignatures(options.signers)
    }

    const simulateRes = await this.c
      .post<SimulateResponse.Data>(
        `/cosmos/tx/v1beta1/simulate`,
        {
          tx_bytes: TxAPI.encode(simTx),
        },
        headers
      )
      .then((d) => SimulateResponse.fromData(d))

    return num(gasAdjustment ?? 0)
      .multipliedBy(simulateRes.gas_info.gas_used)
      .toString()
  }

  /**
   * Query the tx simulation result.
   * @param options tx options with sequence
   */
  public async simulate(
    options: CreateTxOptions & { sequence: number },
    headers: Record<string, string> = {}
  ): Promise<SimulateResponse> {
    const txBody = new TxBody(options.msgs, options.memo ?? '')
    const authInfo = new AuthInfo([], new Fee(0, new Coins()))
    const tx = new Tx(txBody, authInfo, [])
    tx.appendEmptySignatures([{ sequenceNumber: options.sequence }])

    return this.c
      .post<SimulateResponse.Data>(
        `/cosmos/tx/v1beta1/simulate`,
        {
          tx_bytes: TxAPI.encode(tx),
        },
        headers
      )
      .then((d) => SimulateResponse.fromData(d))
  }

  /**
   * Encode a transaction to base64-encoded protobuf.
   * @param tx transaction to encode
   */
  public static encode(tx: Tx): string {
    return Buffer.from(tx.toBytes()).toString('base64')
  }

  /**
   * Decode a transaction from base64-encoded protobuf.
   * @param tx transaction string to decode
   */
  public static decode(encoded_tx: string): Tx {
    return Tx.fromBuffer(Buffer.from(encoded_tx, 'base64'))
  }

  /**
   * Query the transaction's hash.
   * @param tx transaction to hash
   */
  public static hash(tx: Tx): string {
    const txBytes = TxAPI.encode(tx)
    return hashToHex(txBytes)
  }

  private async _broadcast<T>(
    tx: Tx | string,
    mode: keyof typeof BroadcastMode,
    headers: Record<string, string> = {}
  ): Promise<T> {
    return this.c.post<any>(
      `/cosmos/tx/v1beta1/txs`,
      {
        tx_bytes: tx instanceof Tx ? TxAPI.encode(tx) : tx,
        mode,
      },
      headers
    )
  }

  /**
   * Broadcast the transaction using "sync" mode, then wait for its inclusion in a block.
   * This method polls txInfo using the txHash to confirm the transaction's execution.
   * @param tx transaction to broadcast
   * @param timeout time in milliseconds to wait for transaction to be included in a block (default: 30000)
   */
  public async broadcast(
    tx: Tx | string,
    timeout = 30000,
    headers: Record<string, string> = {}
  ): Promise<WaitTxBroadcastResult> {
    const POLL_INTERVAL = 500
    const { tx_response: txResponse } = await this._broadcast<{
      tx_response: SyncTxBroadcastResult.Data
    }>(tx, 'BROADCAST_MODE_SYNC', headers)

    if (txResponse.code != undefined && txResponse.code != 0) {
      const result: WaitTxBroadcastResult = {
        height: parseInt(txResponse.height),
        txhash: txResponse.txhash,
        raw_log: txResponse.raw_log,
        code: txResponse.code,
        codespace: txResponse.codespace,
        gas_used: 0,
        gas_wanted: 0,
        timestamp: '',
        logs: [],
      }
      return result
    }

    let txInfo: undefined | TxInfo
    for (let i = 0; i <= timeout / POLL_INTERVAL; i++) {
      try {
        txInfo = await this.txInfo(txResponse.txhash, {}, headers)
      } catch {
        // Errors when transaction is not found
      }

      if (txInfo) {
        break
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))
    }

    if (!txInfo) {
      throw new Error(
        `Transaction was not included in a block before timeout of ${timeout}ms`
      )
    }

    return {
      txhash: txInfo.txhash,
      raw_log: txInfo.raw_log,
      gas_wanted: txInfo.gas_wanted,
      gas_used: txInfo.gas_used,
      height: +txInfo.height,
      logs: (txInfo.logs ?? []).map((l) => TxLog.fromData(l)),
      code: txInfo.code,
      codespace: txInfo.codespace,
      timestamp: txInfo.timestamp,
    }
  }

  /**
   * NOTE: This is not a synchronous function and is unconventionally named.
   * This function can be awaited as it returns a `Promise`.
   *
   * Broadcast the transaction using the "sync" mode, returning after CheckTx() is performed.
   * @param tx transaction to broadcast
   */
  public async broadcastSync(
    tx: Tx | string,
    headers: Record<string, string> = {}
  ): Promise<SyncTxBroadcastResult> {
    return this._broadcast<{ tx_response: SyncTxBroadcastResult.Data }>(
      tx,
      'BROADCAST_MODE_SYNC',
      headers
    ).then(({ tx_response: d }) => {
      const blockResult: any = {
        height: +d.height,
        txhash: d.txhash,
        raw_log: d.raw_log,
      }

      if (d.code) {
        blockResult.code = d.code // eslint-disable-line @typescript-eslint/no-unsafe-member-access
      }

      if (d.codespace) {
        blockResult.codespace = d.codespace // eslint-disable-line @typescript-eslint/no-unsafe-member-access
      }

      return blockResult
    })
  }

  /**
   * Broadcast the transaction using the "async" mode, returns immediately (transaction might fail).
   * @param tx transaction to broadcast
   */
  public async broadcastAsync(
    tx: Tx | string,
    headers: Record<string, string> = {}
  ): Promise<AsyncTxBroadcastResult> {
    return this._broadcast<{ tx_response: AsyncTxBroadcastResult.Data }>(
      tx,
      'BROADCAST_MODE_ASYNC',
      headers
    ).then(({ tx_response: d }) => ({
      height: +d.height,
      txhash: d.txhash,
    }))
  }

  /**
   * Search for transactions based on event attributes.
   * @param options tx search options
   */
  public async search(
    options: Partial<TxSearchOptions>,
    headers: Record<string, string> = {}
  ): Promise<TxSearchResult> {
    const params = new URLSearchParams()

    const query: string = (options.query ?? []).reduce((str, q) => {
      if (!q.key) return str
      const op = q.op ?? '='
      const value = q.key === 'tx.height' ? `${q.value}` : `'${q.value}'`
      const queryStr =
        op === 'EXISTS' ? `${q.key} ${op}` : `${q.key} ${op} ${value}`
      return str ? `${str} AND ${queryStr}` : queryStr
    }, '')

    if (query) params.append('query', query)
    delete options['query']

    Object.entries(options).forEach((v) => {
      params.append(v[0], String(v[1]))
    })

    return this.c
      .getRaw<TxSearchResult.Data>(`/cosmos/tx/v1beta1/txs`, params, headers)
      .then((d) => {
        return {
          txs: d.tx_responses.map((tx_response) =>
            TxInfo.fromData(tx_response)
          ),
          pagination: d.pagination,
          total: Number(d.total),
        }
      })
  }

  /**
   * Search for events based on module address, module name and start/end heights
   * @param module_addr module address
   * @param module_name module name
   * @param start_height minimum height to search events
   * @param end_height maximum height to search events
   */
  public async searchEvents(
    module_addr: string,
    module_name: string,
    start_height: number,
    end_height: number,
    headers: Record<string, string> = {}
  ): Promise<Event[]> {
    if (end_height < start_height) {
      throw new Error(`Start height cannot be greater than end height`)
    }

    if (end_height - start_height > 100) {
      throw new Error(`Query height range cannot be greater than 100`)
    }

    const targetEvents: Event[] = []
    const targetTag = `${module_addr}::${module_name}`
    const query: TxSearchQuery[] = [
      { key: 'tx.height', value: start_height.toString(), op: '>=' },
      { key: 'tx.height', value: end_height.toString(), op: '<=' },
      { key: 'move.type_tag', value: targetTag, op: 'CONTAINS' },
    ]
    const filterEvents = (tx: TxInfo) => {
      return tx.events.filter((event) => {
        if (event.type !== 'move') return false
        const typeTag = event.attributes.find((attr) => attr.key === 'type_tag')
        return typeTag && typeTag.value.startsWith(targetTag)
      })
    }

    const { txs, total } = await this.search({ query }, headers)
    const events = txs.flatMap((tx) => filterEvents(tx))
    targetEvents.push(...events)

    if (total > 100) {
      const lastPage = Math.ceil(total / 100)
      // if last page = 10, pages = [2, 3, 4, 5, ..., 10]
      const pages = [...Array(lastPage - 1).keys()].map((page) => page + 2)
      const eventsList: Event[][] = await Promise.all(
        pages.map(async (page) => {
          return this.search({ query, page }).then((res) =>
            res.txs.flatMap((tx) => filterEvents(tx))
          )
        })
      )
      targetEvents.push(...eventsList.flat())
    }

    return targetEvents
  }

  /**
   * Query the gas prices for the network.
   */
  public async gasPrices(
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<Coins> {
    return this.c
      .get<{
        gas_prices: Coins.Data
      }>(`/initia/tx/v1/gas_prices`, params, headers)
      .then((d) => Coins.fromData(d.gas_prices))
  }

  /**
   * Query the gas price of a denom for the network.
   */
  public async gasPrice(
    denom: Denom,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<Coin> {
    return this.c
      .get<{
        gas_price: Coin.Data
      }>(`/initia/tx/v1/gas_prices/${denom}`, params, headers)
      .then((d) => Coin.fromData(d.gas_price))
  }
}
