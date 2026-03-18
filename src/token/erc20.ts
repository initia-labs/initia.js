/**
 * ERC20 Token Contract Adapter.
 *
 * Implements TokenContract interface for EVM chains using standard ERC20 ABI.
 */

import type { Numeric } from '../types'
import type { Client as ConnectClient } from '@connectrpc/connect'
import { encodeFunctionData, decodeFunctionResult } from 'viem'
import type { Query as EvmQuery } from '@buf/initia-labs_minievm.bufbuild_es/minievm/evm/v1/query_pb'
import { MsgCallSchema } from '@buf/initia-labs_minievm.bufbuild_es/minievm/evm/v1/tx_pb'

import type { TokenInfo } from '../contracts/types'
import { Message } from '../msgs/types'
import type { TokenContract } from './types'

type EvmClient = ConnectClient<typeof EvmQuery>

/**
 * Minimal ERC20 ABI for token operations.
 */
const ERC20_ABI = [
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
]

const ZERO_ADDRESS_BECH32 = 'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqa4qvvl'

/**
 * Create an ERC20 TokenContract adapter.
 */
export function createErc20Token(
  evmClient: EvmClient,
  contractAddress: string,
  sender?: string
): TokenContract {
  const querySender = sender ?? ZERO_ADDRESS_BECH32

  async function call(functionName: string, args: unknown[] = []): Promise<string> {
    const input = encodeFunctionData({
      abi: ERC20_ABI,
      functionName,
      args,
    })

    const response = await evmClient.call({
      sender: querySender,
      contractAddr: contractAddress,
      input,
      value: '0',
      accessList: [],
    })

    if (response.error) {
      throw new Error(`ERC20 call failed (${functionName}): ${response.error}`)
    }

    return response.response.startsWith('0x') ? response.response : `0x${response.response}`
  }

  function decode(functionName: string, data: string): unknown {
    return decodeFunctionResult({
      abi: ERC20_ABI,
      functionName,
      data: data as `0x${string}`,
    })
  }

  return {
    async getInfo(): Promise<TokenInfo> {
      const [nameHex, symbolHex, decimalsHex, totalSupplyHex] = await Promise.all([
        call('name'),
        call('symbol'),
        call('decimals'),
        call('totalSupply'),
      ])

      return {
        name: decode('name', nameHex) as string,
        symbol: decode('symbol', symbolHex) as string,
        decimals: Number(decode('decimals', decimalsHex)),
        totalSupply: decode('totalSupply', totalSupplyHex) as bigint,
      }
    },

    async balanceOf(owner: string): Promise<bigint> {
      const hex = await call('balanceOf', [owner])
      return decode('balanceOf', hex) as bigint
    },

    createTransferMsg(msgSender: string, to: string, amount: Numeric): Message {
      const input = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [to, BigInt(amount)],
      })

      return new Message(MsgCallSchema, {
        sender: msgSender,
        contractAddr: contractAddress,
        input,
        value: '0',
        accessList: [],
      })
    },

    async allowance(owner: string, spender: string): Promise<bigint> {
      const hex = await call('allowance', [owner, spender])
      return decode('allowance', hex) as bigint
    },

    createApproveMsg(msgSender: string, spender: string, amount: Numeric): Message {
      const input = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spender, BigInt(amount)],
      })

      return new Message(MsgCallSchema, {
        sender: msgSender,
        contractAddr: contractAddress,
        input,
        value: '0',
        accessList: [],
      })
    },
  }
}
