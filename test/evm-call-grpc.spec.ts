/**
 * Test: EVM Call via gRPC
 *
 * Verifies that Minievm's Query.Call RPC can be used for EVM read operations
 * (equivalent to eth_call in JSON-RPC).
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@connectrpc/connect'
import { createGrpcTransport } from '@connectrpc/connect-node'
import { Query as EvmQuery } from '@buf/initia-labs_minievm.bufbuild_es/minievm/evm/v1/query_pb'
import { encodeFunctionData, decodeFunctionResult, parseAbi } from 'viem'
import { createRegistryProvider } from '../src/provider/registry-provider'

// Zero address in bech32 format for minievm (init1 prefix)
const ZERO_ADDRESS_BECH32 = 'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqa4qvvl'

const ERC20_ABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
])

describe('EVM Call via gRPC', () => {
  let evmClient: ReturnType<typeof createClient<typeof EvmQuery>>
  let erc20Address: string

  beforeAll(async () => {
    const provider = await createRegistryProvider({ network: 'testnet' })
    const evm1 = provider.listChains().find(c => c.chainId === 'evm-1')
    if (!evm1?.grpc) throw new Error('No evm-1 testnet gRPC found')

    const transport = createGrpcTransport({ baseUrl: evm1.grpc })
    evmClient = createClient(EvmQuery, transport)

    // Discover an ERC20 contract address using the chain's native denom
    if (evm1.nativeDenom) {
      try {
        const response = await evmClient.contractAddrByDenom({ denom: evm1.nativeDenom })
        if (response.address) {
          erc20Address = response.address
          console.log(`Found ERC20 for native denom "${evm1.nativeDenom}":`, erc20Address)
          return
        }
      } catch {
        /* try denom reverse lookup */
      }
    }

    // Fallback: reverse lookup from known ERC20 wrapper address
    const factoryRes = await evmClient.eRC20Factory({})
    if (factoryRes.address) {
      // Use denom reverse lookup on the factory address itself to verify connectivity
      try {
        const denomRes = await evmClient.denom({ contractAddr: factoryRes.address })
        if (denomRes.denom) {
          const addrRes = await evmClient.contractAddrByDenom({ denom: denomRes.denom })
          if (addrRes.address) {
            erc20Address = addrRes.address
            console.log(`Found ERC20 via factory denom "${denomRes.denom}":`, erc20Address)
            return
          }
        }
      } catch {
        /* factory itself may not have a denom mapping */
      }
    }

    throw new Error('No ERC20 token found on evm-1 testnet')
  }, 30000)

  it('should get ERC20Factory address', async () => {
    const response = await evmClient.eRC20Factory({})
    expect(response.address).toBeTruthy()
    expect(response.address.startsWith('0x')).toBe(true)
  })

  it('should call ERC20 name() via gRPC Query.Call', async () => {
    const input = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'name',
    })

    const response = await evmClient.call({
      sender: ZERO_ADDRESS_BECH32,
      contractAddr: erc20Address,
      input,
      value: '0',
      accessList: [],
    })

    expect(response.error).toBeFalsy()
    expect(response.response).toBeTruthy()

    const data = response.response.startsWith('0x') ? response.response : `0x${response.response}`
    const name = decodeFunctionResult({
      abi: ERC20_ABI,
      functionName: 'name',
      data: data as `0x${string}`,
    })
    expect(typeof name).toBe('string')
  })

  it('should call ERC20 decimals() via gRPC Query.Call', async () => {
    const input = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'decimals',
    })

    const response = await evmClient.call({
      sender: ZERO_ADDRESS_BECH32,
      contractAddr: erc20Address,
      input,
      value: '0',
      accessList: [],
    })

    expect(response.error).toBeFalsy()
    expect(response.response).toBeTruthy()

    const data = response.response.startsWith('0x') ? response.response : `0x${response.response}`
    const decimals = decodeFunctionResult({
      abi: ERC20_ABI,
      functionName: 'decimals',
      data: data as `0x${string}`,
    })
    expect(typeof decimals).toBe('number')
  })

  it('should call ERC20 balanceOf() via gRPC Query.Call', async () => {
    const testAddress = '0x0000000000000000000000000000000000000001'

    const input = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [testAddress],
    })

    const response = await evmClient.call({
      sender: ZERO_ADDRESS_BECH32,
      contractAddr: erc20Address,
      input,
      value: '0',
      accessList: [],
    })

    expect(response.error).toBeFalsy()
    expect(response.response).toBeTruthy()

    const data = response.response.startsWith('0x') ? response.response : `0x${response.response}`
    const balance = decodeFunctionResult({
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      data: data as `0x${string}`,
    })
    expect(typeof balance).toBe('bigint')
  })

  it('should handle invalid function selector gracefully', async () => {
    const response = await evmClient.call({
      sender: ZERO_ADDRESS_BECH32,
      contractAddr: erc20Address,
      input: '0xdeadbeef',
      value: '0',
      accessList: [],
    })

    // Invalid selector should produce an error or empty/revert response
    expect(response.error || !response.response).toBeTruthy()
  })
})
