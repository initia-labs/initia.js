/**
 * Gas estimation module - Estimate gas for transactions.
 */

import { create } from '@bufbuild/protobuf'
import { type MsgInput, normalizeMsg } from '../msgs/types'
import {
  TxSchema,
  TxBodySchema,
  AuthInfoSchema,
  SignerInfoSchema,
  ModeInfoSchema,
  FeeSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/v1beta1/tx_pb'
import { SignMode } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/signing/v1beta1/signing_pb'
import { Coin } from '../core/coin'
import { DecCoins } from '../core/coins'
import { getAccount, type AuthClient } from '../core/account'
import { AccountNotFoundError, isNotFoundError, ParseError, SimulationError } from '../errors'

/**
 * Gas estimation result.
 */
export interface GasEstimate {
  /** Estimated gas limit (with multiplier applied) */
  gasLimit: bigint
  /** Calculated fee based on gas limit and gas price */
  fee: Coin[]
}

/**
 * Options for gas estimation.
 */
export interface EstimateOptions {
  /** Gas multiplier (default: 1.3) */
  multiplier?: number
  /** Gas price (e.g., '0.015uinit') */
  gasPrice?: string
}

/**
 * Minimal client interface for gas estimation.
 * Compatible with any client that has tx.simulate and auth.account services.
 */
export interface SimulateClient extends AuthClient {
  tx: {
    simulate(request: { txBytes?: Uint8Array; tx?: unknown }): Promise<{
      gasInfo?: {
        gasUsed: bigint
        gasWanted: bigint
      }
    }>
  }
}

/**
 * Parse gas price string into denom and amount.
 * @param gasPrice - e.g., '0.015uinit'
 * @returns { amount: string, denom: string }
 */
function parseGasPrice(gasPrice: string): { amount: string; denom: string } {
  // Match number (including decimal) followed by denom
  const match = gasPrice.match(/^([\d.]+)(.+)$/)
  if (!match) {
    throw new ParseError('gasPrice', `Invalid format: ${gasPrice}`)
  }
  return {
    amount: match[1],
    denom: match[2],
  }
}

/**
 * Calculate fee from gas limit and gas price.
 */
function calculateFee(gasLimit: bigint, gasPrice: string): Coin[] {
  const { amount, denom } = parseGasPrice(gasPrice)
  const feeAmount = mulBigIntByFloat(gasLimit, parseFloat(amount))
  return [new Coin(denom, feeAmount)]
}

/**
 * Multiply a bigint by a float using fixed-point arithmetic.
 * Avoids Number(bigint) precision loss for values > 2^53.
 * The multiplier is scaled to 6 decimal places and ceiled, so the result
 * may be slightly above the true mathematical ceiling. This is safe for
 * gas estimation (always rounds in the user's favor).
 */
function mulBigIntByFloat(value: bigint, multiplier: number): bigint {
  if (!Number.isFinite(multiplier) || multiplier < 0) {
    throw new ParseError('multiplier', `Expected a non-negative finite number, got: ${multiplier}`)
  }
  const PRECISION = 1_000_000n
  const scaledMultiplier = BigInt(Math.ceil(multiplier * Number(PRECISION)))
  return (value * scaledMultiplier + PRECISION - 1n) / PRECISION // ceil division
}

/**
 * Estimate gas for a transaction.
 *
 * Uses the simulate endpoint to get accurate gas estimation.
 *
 * @param client - gRPC client with tx service
 * @param msgs - Messages to estimate gas for
 * @param signer - Signer address (for simulation)
 * @param options - Estimation options
 * @returns Gas estimate with fee
 *
 * @example
 * ```typescript
 * const estimate = await estimateGas(client, [sendMsg], wallet.address, {
 *   multiplier: 1.3,
 *   gasPrice: '0.015uinit'
 * })
 *
 * console.log('Gas limit:', estimate.gasLimit)
 * console.log('Fee:', estimate.fee)
 * ```
 */
export async function estimateGas(
  client: SimulateClient,
  msgs: MsgInput[],
  signer: string,
  options?: EstimateOptions
): Promise<GasEstimate> {
  const multiplier = options?.multiplier ?? 1.3
  const gasPrice = options?.gasPrice ?? '0.015uinit'

  // Fetch current account sequence for accurate simulation
  let sequence = 0n
  try {
    const account = await getAccount(client, signer)
    sequence = account.sequence
  } catch (error) {
    // Account not found = new account, sequence 0 is correct.
    // Some chains return gRPC NotFound for non-existent accounts.
    // Any other error (network, auth) should propagate.
    if (!(error instanceof AccountNotFoundError) && !isNotFoundError(error)) {
      throw error
    }
  }

  // Create a minimal tx for simulation
  // Note: For simulation, we don't need a valid signature
  const txBody = create(TxBodySchema, {
    messages: msgs.map(m => normalizeMsg(m).toAny()),
    memo: '',
    timeoutHeight: 0n,
    extensionOptions: [],
    nonCriticalExtensionOptions: [],
  })

  // Create minimal auth info (empty signature is ok for simulation)
  const signerInfo = create(SignerInfoSchema, {
    publicKey: undefined, // Not needed for simulation
    modeInfo: create(ModeInfoSchema, {
      sum: {
        case: 'single',
        value: { mode: SignMode.DIRECT },
      },
    }),
    sequence,
  })

  const fee = create(FeeSchema, {
    amount: [],
    gasLimit: 0n,
    payer: '',
    granter: '',
  })

  const authInfo = create(AuthInfoSchema, {
    signerInfos: [signerInfo],
    fee,
    tip: undefined,
  })

  // Create the tx for simulation
  const tx = create(TxSchema, {
    body: txBody,
    authInfo,
    signatures: [new Uint8Array(64)], // Empty signature for simulation
  })

  // Simulate the transaction
  const response = await client.tx.simulate({
    tx: tx as unknown,
  })

  if (!response.gasInfo) {
    throw new SimulationError('No gas info returned')
  }

  // Apply multiplier and calculate fee
  const gasUsed = response.gasInfo.gasUsed
  const gasLimit = mulBigIntByFloat(gasUsed, multiplier)
  const calculatedFee = calculateFee(gasLimit, gasPrice)

  return {
    gasLimit,
    fee: calculatedFee,
  }
}

/**
 * Minimal client interface for gas price discovery.
 *
 * On Initia L1, gas prices are fetched from the `initiaTx` service.
 * On L2 rollups (opchild), gas prices come from the `opchild` module params.
 */
export interface GasPriceClient {
  initiaTx?: {
    gasPrices(req: Record<string, never>): Promise<{
      gasPrices: { denom: string; amount: string }[]
    }>
  }
  opchild?: {
    params(req: Record<string, never>): Promise<{
      params?: { minGasPrices: { denom: string; amount: string }[] }
    }>
  }
}

/**
 * Fetch the on-chain gas prices for a chain.
 *
 * Automatically detects chain type:
 * - L1 (Initia): queries `initiaTx.gasPrices`
 * - L2 (rollup): queries `opchild.params.minGasPrices`
 *
 * @param client - gRPC client with either `initiaTx` or `opchild` service
 * @returns DecCoins collection of gas prices per denom
 * @throws Error if neither `initiaTx` nor `opchild` service is available
 *
 * @example
 * ```typescript
 * // L1
 * const prices = await getGasPrices(client)
 * console.log(prices.get('uinit')?.amount) // '0.015000000000000000'
 *
 * // L2 rollup
 * const prices = await getGasPrices(l2Client)
 * ```
 */
export async function getGasPrices(client: GasPriceClient): Promise<DecCoins> {
  if (client.initiaTx) {
    const res = await client.initiaTx.gasPrices({})
    return new DecCoins(res.gasPrices)
  }
  if (client.opchild) {
    const res = await client.opchild.params({})
    if (!res.params) {
      throw new Error('getGasPrices: opchild.params() returned no params')
    }
    return new DecCoins(res.params.minGasPrices)
  }
  throw new Error('Cannot determine gas prices: client has neither initiaTx nor opchild service')
}
