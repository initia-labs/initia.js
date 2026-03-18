/**
 * Token Resolver - VM dispatch logic.
 *
 * Resolves a token identifier to the appropriate TokenContract adapter
 * based on chain type and address format.
 */

import type { Client as ConnectClient } from '@connectrpc/connect'
import type { Query as EvmQuery } from '@buf/initia-labs_minievm.bufbuild_es/minievm/evm/v1/query_pb'
import type { Query as WasmQuery } from '@buf/cosmwasm_wasmd.bufbuild_es/cosmwasm/wasm/v1/query_pb'
import type { Query as MoveQuery } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/query_pb'

import type { ChainType } from '../client/types'
import type { TokenContract } from './types'
import { createErc20Token } from './erc20'
import { createCw20Token } from './cw20'
import { createFungibleAssetToken } from './fungible-asset'

export interface EvmEnabled {
  evm: ConnectClient<typeof EvmQuery>
}

export interface WasmEnabled {
  wasm: ConnectClient<typeof WasmQuery>
}

export interface MoveEnabled {
  move: ConnectClient<typeof MoveQuery>
}

/**
 * Resolve a token identifier to a TokenContract adapter.
 *
 * Dispatch rules:
 * - minievm + 0x address → ERC20
 * - miniwasm + bech32 address → CW20
 * - initia/minimove + metadata address → Move Fungible Asset
 *
 * @param client - gRPC client with appropriate services
 * @param chainType - Chain type for dispatch
 * @param token - Token identifier (contract address or metadata address)
 * @param sender - Optional sender for EVM read queries
 * @throws Error if chain type doesn't match token format
 */
export function resolveTokenContract(
  client: EvmEnabled,
  chainType: 'minievm',
  token: string,
  sender?: string
): TokenContract
export function resolveTokenContract(
  client: WasmEnabled,
  chainType: 'miniwasm',
  token: string,
  sender?: string
): TokenContract
export function resolveTokenContract(
  client: MoveEnabled,
  chainType: 'initia' | 'minimove',
  token: string,
  sender?: string
): TokenContract
export function resolveTokenContract(
  client: EvmEnabled | WasmEnabled | MoveEnabled,
  chainType: ChainType,
  token: string,
  sender?: string
): TokenContract {
  switch (chainType) {
    case 'minievm': {
      if (!token.startsWith('0x')) {
        throw new Error(
          `Invalid token address for minievm: expected 0x-prefixed address, got "${token}"`
        )
      }
      return createErc20Token((client as EvmEnabled).evm, token, sender)
    }

    case 'miniwasm': {
      if (token.startsWith('0x')) {
        throw new Error(
          `Invalid token address for miniwasm: expected bech32 address, got "${token}"`
        )
      }
      return createCw20Token((client as WasmEnabled).wasm, token)
    }

    case 'initia':
    case 'minimove': {
      return createFungibleAssetToken((client as MoveEnabled).move, token)
    }

    default:
      throw new Error(
        `Token contract not supported for chain type "${chainType}". ` +
          'Use bank module queries (ctx.getBalance) for native denoms on unsupported chain types.'
      )
  }
}
