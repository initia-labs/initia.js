/**
 * Move Fungible Asset Token Contract Adapter.
 *
 * Implements TokenContract interface for Move-based chains (initia, minimove)
 * using the Initia fungible_asset and primary_fungible_store modules.
 */

import type { Numeric } from '../types'
import { jsonStringifyArg } from '../util/json'
import type { Client as ConnectClient } from '@connectrpc/connect'
import { MsgExecuteJSONSchema } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/tx_pb'
import type { Query as MoveQuery } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/query_pb'

import type { TokenInfo } from '../contracts/types'
import { Message } from '../msgs/types'
import type { TokenContract } from './types'

type MoveClient = ConnectClient<typeof MoveQuery>

/**
 * Create a Move Fungible Asset TokenContract adapter.
 *
 * @param moveClient - Move query client
 * @param metadataAddress - Metadata object address identifying the token
 */
export function createFungibleAssetToken(
  moveClient: MoveClient,
  metadataAddress: string
): TokenContract {
  async function viewJSON(
    moduleName: string,
    functionName: string,
    args: unknown[],
    typeArgs: string[] = []
  ): Promise<unknown> {
    const response = await moveClient.viewJSON({
      address: '0x1',
      moduleName,
      functionName,
      typeArgs,
      args: args.map(jsonStringifyArg),
    })

    try {
      return JSON.parse(response.data)
    } catch {
      throw new Error(
        `Failed to parse Move view response for ${moduleName}::${functionName}: ${response.data}`
      )
    }
  }

  return {
    async getInfo(): Promise<TokenInfo> {
      const [name, symbol, decimals, supply] = await Promise.all([
        viewJSON('fungible_asset', 'name', [metadataAddress]),
        viewJSON('fungible_asset', 'symbol', [metadataAddress]),
        viewJSON('fungible_asset', 'decimals', [metadataAddress]),
        viewJSON('fungible_asset', 'supply', [metadataAddress]),
      ])

      return {
        name: name as string,
        symbol: symbol as string,
        decimals: Number(decimals),
        totalSupply: supply != null ? BigInt(supply as string) : undefined,
      }
    },

    async balanceOf(owner: string): Promise<bigint> {
      const result = await viewJSON('primary_fungible_store', 'balance', [owner, metadataAddress])
      return BigInt(result as string)
    },

    createTransferMsg(sender: string, to: string, amount: Numeric): Message {
      return new Message(MsgExecuteJSONSchema, {
        sender,
        moduleAddress: '0x1',
        moduleName: 'primary_fungible_store',
        functionName: 'transfer',
        typeArgs: [],
        args: [
          JSON.stringify(metadataAddress),
          JSON.stringify(to),
          JSON.stringify(amount.toString()),
        ],
      })
    },

    // Move fungible_asset does not have allowance/approve concept
  }
}
