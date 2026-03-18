/**
 * CW20 Token Contract Adapter.
 *
 * Implements TokenContract interface for Wasm chains using CW20 standard messages.
 */

import type { Numeric } from '../types'
import type { Client as ConnectClient } from '@connectrpc/connect'
import { MsgExecuteContractSchema } from '@buf/cosmwasm_wasmd.bufbuild_es/cosmwasm/wasm/v1/tx_pb'
import type { Query as WasmQuery } from '@buf/cosmwasm_wasmd.bufbuild_es/cosmwasm/wasm/v1/query_pb'

import type { TokenInfo } from '../contracts/types'
import { Message } from '../msgs/types'
import type { TokenContract } from './types'
import { encodeMsg, decodeResponse } from '../util/json'

type WasmClient = ConnectClient<typeof WasmQuery>

/**
 * Create a CW20 TokenContract adapter.
 */
export function createCw20Token(wasmClient: WasmClient, contractAddress: string): TokenContract {
  async function query(msg: object): Promise<unknown> {
    const response = await wasmClient.smartContractState({
      address: contractAddress,
      queryData: encodeMsg(msg),
    })
    return decodeResponse(response.data)
  }

  return {
    async getInfo(): Promise<TokenInfo> {
      const result = (await query({ token_info: {} })) as {
        name: string
        symbol: string
        decimals: number
        total_supply: string
      }

      return {
        name: result.name,
        symbol: result.symbol,
        decimals: result.decimals,
        totalSupply: BigInt(result.total_supply),
      }
    },

    async balanceOf(owner: string): Promise<bigint> {
      const result = (await query({ balance: { address: owner } })) as {
        balance: string
      }
      return BigInt(result.balance)
    },

    createTransferMsg(sender: string, to: string, amount: Numeric): Message {
      return new Message(MsgExecuteContractSchema, {
        sender,
        contract: contractAddress,
        msg: encodeMsg({ transfer: { recipient: to, amount: amount.toString() } }),
        funds: [],
      })
    },

    async allowance(owner: string, spender: string): Promise<bigint> {
      const result = (await query({ allowance: { owner, spender } })) as {
        allowance: string
      }
      return BigInt(result.allowance)
    },

    createApproveMsg(sender: string, spender: string, amount: Numeric): Message {
      return new Message(MsgExecuteContractSchema, {
        sender,
        contract: contractAddress,
        msg: encodeMsg({ increase_allowance: { spender, amount: amount.toString() } }),
        funds: [],
      })
    },
  }
}
