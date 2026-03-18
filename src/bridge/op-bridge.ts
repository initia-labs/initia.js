/**
 * OPInit Bridge utility class.
 *
 * Provides bridgeId resolution, message generation for L1 ↔ L2 transfers,
 * and withdrawal status tracking.
 */

import type { Numeric } from '../types'
import { create } from '@bufbuild/protobuf'
import { CoinSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/base/v1beta1/coin_pb'
import {
  MsgInitiateTokenDepositSchema,
  MsgFinalizeTokenWithdrawalSchema,
} from '@buf/initia-labs_opinit.bufbuild_es/opinit/ophost/v1/tx_pb'
import { MsgInitiateTokenWithdrawalSchema } from '@buf/initia-labs_opinit.bufbuild_es/opinit/opchild/v1/tx_pb'
import type { ChainInfo, ChainInfoProvider } from '../provider/types'
import type { InitiaClient } from '../client/types'
import type { TransportFactory } from '../client/transport-common'
import { Message } from '../msgs/types'
import type {
  ClaimOptions,
  DepositOptions,
  WithdrawOptions,
  WithdrawalInfo,
  WithdrawalStatus,
} from './types'
import { parseCoin } from '../core/coin'
import { hexToBytes } from '@noble/hashes/utils.js'
import { isNotFoundError } from '../errors'
import { initiaChain } from '../chains/initia'
import { createGrpcClient } from '../client/grpc-client'
import { wrapClientWithCache } from '../client/cached-client'
import { fetchWithdrawals, fetchWithdrawal, type FetchWithdrawalsOptions } from './executor'
import { calculateWithdrawalHash } from './hash'
import { durationToMs, timestampToMs } from './utils'

/**
 * Internal OP bridge implementation.
 * Use `provider.bridge` instead of instantiating directly.
 */
export class OpBridgeInternal {
  private _l1Client?: InitiaClient

  constructor(
    private provider: ChainInfoProvider,
    private createTransport: TransportFactory
  ) {}

  /**
   * Lazily create and cache the L1 ophost gRPC client.
   * Finds L1 chain from provider automatically.
   */
  private getL1Client(): InitiaClient {
    if (this._l1Client) return this._l1Client
    const l1Chain = this.provider.listChains().find(c => c.chainType === 'initia')
    if (!l1Chain) {
      throw new Error(
        'L1 (initia) chain not found in provider. ' +
          'Ensure the provider includes L1 chain info for withdrawal status queries.'
      )
    }
    const config = initiaChain.build()
    const transport = this.createTransport(l1Chain)
    const raw = createGrpcClient(transport, config.services, undefined, undefined, config.registry)
    this._l1Client = wrapClientWithCache(raw, l1Chain.chainId) as InitiaClient
    return this._l1Client
  }

  /**
   * Resolve bridgeId for a given L2 chain.
   *
   * @param l2ChainId - The L2 chain ID (e.g., 'minimove-1')
   * @returns The bridge ID for the L2 chain
   * @throws Error if chain is not found or has no opBridgeId
   */
  getBridgeId(l2ChainId: string): bigint {
    const chainInfo = this.provider.getChainInfo(l2ChainId)
    if (!chainInfo) {
      throw new Error(`Chain not found: ${l2ChainId}`)
    }
    if (chainInfo.opBridgeId == null) {
      throw new Error(
        `Chain ${l2ChainId} does not have an opBridgeId. Only L2 (minitia) chains support bridging.`
      )
    }
    return chainInfo.opBridgeId
  }

  /**
   * Create a MsgInitiateTokenDeposit for L1 → L2 transfer.
   *
   * @param options - Deposit options (use toChain for auto bridgeId resolve, or bridgeId directly)
   * @returns Packed Message ready for signAndBroadcast
   */
  deposit(options: DepositOptions): Message {
    const { sender, to, amount, data } = options
    const bridgeId =
      'toChain' in options && options.toChain ? this.getBridgeId(options.toChain) : options.bridgeId

    const resolvedCoin = typeof amount === 'string' ? parseCoin(amount) : amount

    return new Message(MsgInitiateTokenDepositSchema, {
      sender,
      bridgeId: BigInt(bridgeId!),
      to: to ?? sender,
      amount: create(CoinSchema, {
        denom: resolvedCoin.denom,
        amount: resolvedCoin.amount,
      }),
      data: data ?? new Uint8Array(),
    })
  }

  /**
   * Create a MsgInitiateTokenWithdrawal for L2 → L1 transfer.
   *
   * @param options - Withdrawal options
   * @returns Packed Message ready for signAndBroadcast
   */
  withdraw(options: WithdrawOptions): Message {
    const { sender, to, amount } = options
    const resolvedCoin = typeof amount === 'string' ? parseCoin(amount) : amount

    return new Message(MsgInitiateTokenWithdrawalSchema, {
      sender,
      to: to ?? sender,
      amount: create(CoinSchema, {
        denom: resolvedCoin.denom,
        amount: resolvedCoin.amount,
      }),
    })
  }

  /**
   * Create a MsgFinalizeTokenWithdrawal to claim a withdrawal on L1.
   *
   * @param options - Claim options with sender and withdrawal info (must be 'claimable')
   * @returns Packed Message ready for signAndBroadcast
   * @throws Error if withdrawal status is not 'claimable'
   */
  claim(options: ClaimOptions): Message {
    const { sender, withdrawal } = options

    if (withdrawal.status.status !== 'claimable') {
      throw new Error(`Withdrawal is not claimable (current status: ${withdrawal.status.status})`)
    }

    return new Message(MsgFinalizeTokenWithdrawalSchema, {
      sender,
      bridgeId: withdrawal.bridgeId,
      outputIndex: withdrawal.outputIndex,
      withdrawalProofs: withdrawal.withdrawalProofs.map(p => hexToBytes(p)),
      from: withdrawal.from,
      to: withdrawal.to,
      sequence: withdrawal.sequence,
      amount: create(CoinSchema, {
        denom: withdrawal.amount.denom,
        amount: withdrawal.amount.amount,
      }),
      version: hexToBytes(withdrawal.version),
      storageRoot: hexToBytes(withdrawal.storageRoot),
      lastBlockHash: hexToBytes(withdrawal.lastBlockHash),
    })
  }

  /**
   * List all chains that support OPInit bridging.
   *
   * @returns Array of ChainInfo with opBridgeId defined
   */
  listBridgeableChains(): ChainInfo[] {
    return this.provider.listChains().filter(c => c.opBridgeId != null)
  }

  /**
   * Fetch withdrawals for an address and determine their statuses via L1 queries.
   *
   * @param l2ChainId - The L2 chain ID (e.g., 'minimove-1')
   * @param address - L2 sender address
   * @param options - Pagination options for Executor API
   * @returns Array of WithdrawalInfo with status determined
   */
  async getWithdrawals(
    l2ChainId: string,
    address: string,
    options?: FetchWithdrawalsOptions
  ): Promise<WithdrawalInfo[]> {
    const l2Info = this.provider.getChainInfo(l2ChainId)
    if (!l2Info) throw new Error(`Chain not found: ${l2ChainId}`)
    if (!l2Info.executorUri) {
      throw new Error(`Chain ${l2ChainId} does not have an executorUri. Cannot fetch withdrawals.`)
    }
    if (l2Info.opBridgeId == null) {
      throw new Error(`Chain ${l2ChainId} does not have an opBridgeId`)
    }

    // 1. Fetch withdrawals from Executor API
    const rawWithdrawals = await fetchWithdrawals(l2Info.executorUri, address, options)
    if (rawWithdrawals.length === 0) return []

    // 2. Get L1 ophost client and query bridge config
    const ophost = this.getL1Client().ophost
    const bridgeResponse = await ophost.bridge({ bridgeId: l2Info.opBridgeId })
    const finalizationPeriod = bridgeResponse.bridgeConfig?.finalizationPeriod
    if (!finalizationPeriod) {
      throw new Error('Bridge config missing finalizationPeriod')
    }
    const finalizationMs = durationToMs(finalizationPeriod)

    // 3. Find pending boundary: query latest proposed output
    let latestProposedIndex = 0n
    try {
      const proposalsResponse = await ophost.outputProposals({
        bridgeId: l2Info.opBridgeId,
        pagination: { reverse: true, limit: 1n },
      })
      if (proposalsResponse.outputProposals.length > 0) {
        latestProposedIndex = proposalsResponse.outputProposals[0].outputIndex
      }
    } catch (err) {
      // No proposals yet is normal for new bridges; any other error should propagate
      if (!isNotFoundError(err)) throw err
    }

    // 4. Query outputProposal for each unique non-pending outputIndex
    const nonPendingIndices = [
      ...new Set(
        rawWithdrawals.map(w => w.outputIndex).filter(i => i > 0n && i <= latestProposedIndex)
      ),
    ]

    const outputTimestamps = new Map<bigint, number>() // outputIndex → l1BlockTime in ms
    await Promise.all(
      nonPendingIndices.map(async outputIndex => {
        try {
          const response = await ophost.outputProposal({
            bridgeId: l2Info.opBridgeId!,
            outputIndex,
          })
          if (response.outputProposal?.l1BlockTime) {
            outputTimestamps.set(outputIndex, timestampToMs(response.outputProposal.l1BlockTime))
          }
        } catch (err) {
          // Output not found is expected; other errors should propagate
          if (!isNotFoundError(err)) throw err
        }
      })
    )

    // 5. Determine status for each withdrawal
    const now = Date.now()
    return Promise.all(
      rawWithdrawals.map(async (raw): Promise<WithdrawalInfo> => {
        const status = await this.determineWithdrawalStatus(
          raw,
          outputTimestamps,
          latestProposedIndex,
          finalizationMs,
          now,
          ophost
        )
        return { ...raw, status }
      })
    )
  }

  /**
   * Fetch a single withdrawal and determine its status.
   *
   * @param l2ChainId - The L2 chain ID
   * @param sequence - Withdrawal sequence number
   * @returns WithdrawalInfo with status determined
   */
  async getWithdrawalStatus(l2ChainId: string, sequence: Numeric): Promise<WithdrawalInfo> {
    const l2Info = this.provider.getChainInfo(l2ChainId)
    if (!l2Info) throw new Error(`Chain not found: ${l2ChainId}`)
    if (!l2Info.executorUri) {
      throw new Error(`Chain ${l2ChainId} does not have an executorUri. Cannot fetch withdrawal.`)
    }
    if (l2Info.opBridgeId == null) {
      throw new Error(`Chain ${l2ChainId} does not have an opBridgeId`)
    }

    // Fetch single withdrawal from Executor
    const raw = await fetchWithdrawal(l2Info.executorUri, sequence)

    // Get L1 ophost client and query bridge config
    const ophost = this.getL1Client().ophost
    const bridgeResponse = await ophost.bridge({ bridgeId: l2Info.opBridgeId })
    const finalizationPeriod = bridgeResponse.bridgeConfig?.finalizationPeriod
    if (!finalizationPeriod) {
      throw new Error('Bridge config missing finalizationPeriod')
    }
    const finalizationMs = durationToMs(finalizationPeriod)

    // Query output proposal for this withdrawal's outputIndex
    const outputTimestamps = new Map<bigint, number>()
    let latestProposedIndex = 0n

    if (raw.outputIndex > 0n) {
      try {
        const response = await ophost.outputProposal({
          bridgeId: l2Info.opBridgeId,
          outputIndex: raw.outputIndex,
        })
        if (response.outputProposal?.l1BlockTime) {
          outputTimestamps.set(raw.outputIndex, timestampToMs(response.outputProposal.l1BlockTime))
          latestProposedIndex = raw.outputIndex // exists, so it's at least this
        }
      } catch (err) {
        // Output not found — treat as pending (same as getWithdrawals)
        if (!isNotFoundError(err)) throw err
      }
    }

    const status = await this.determineWithdrawalStatus(
      raw,
      outputTimestamps,
      latestProposedIndex,
      finalizationMs,
      Date.now(),
      ophost
    )
    return { ...raw, status }
  }

  /**
   * Determine withdrawal status based on output proposals and finalization period.
   */
  private async determineWithdrawalStatus(
    raw: Omit<WithdrawalInfo, 'status'>,
    outputTimestamps: Map<bigint, number>,
    latestProposedIndex: bigint,
    finalizationMs: number,
    now: number,
    ophost: InitiaClient['ophost']
  ): Promise<WithdrawalStatus> {
    // No output proposal or not yet proposed → pending
    if (raw.outputIndex === 0n || raw.outputIndex > latestProposedIndex) {
      return { status: 'pending' }
    }

    const l1BlockTimeMs = outputTimestamps.get(raw.outputIndex)
    if (l1BlockTimeMs == null) {
      return { status: 'pending' }
    }

    // Check if finalization period has passed
    const claimableAt = new Date(l1BlockTimeMs + finalizationMs)
    if (claimableAt.getTime() > now) {
      return { status: 'waiting', claimableAt }
    }

    // Finalization period passed → check if already claimed
    const hash = calculateWithdrawalHash(
      raw.bridgeId,
      raw.sequence,
      raw.from,
      raw.to,
      raw.amount.denom,
      BigInt(raw.amount.amount)
    )

    try {
      const claimedResponse = await ophost.claimed({
        bridgeId: raw.bridgeId,
        withdrawalHash: hash,
      })
      if (claimedResponse.claimed) {
        return { status: 'claimed' }
      }
    } catch (err) {
      // NotFound means the withdrawal has not been claimed on L1 yet — treat as claimable
      if (!isNotFoundError(err)) throw err
    }

    return { status: 'claimable' }
  }
}
