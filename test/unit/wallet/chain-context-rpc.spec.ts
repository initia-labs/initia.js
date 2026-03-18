import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildChainContextFactory } from '../../../src/wallet/chain-context'
import { RpcClient } from '../../../src/client/rpc'
import type { Transport } from '@connectrpc/connect'
import type { ChainInfo, ChainInfoForType } from '../../../src/provider/types'

// Factory using mock transport
const mockTransport = {} as Transport
const createChainContext = buildChainContextFactory(
  () => mockTransport,
  () => ({}),
  () => ({}) as never
)

// Persistent spies — capture constructor args without reassignment
const rpcCtorSpy = vi.fn()
const evmRpcCtorSpy = vi.fn()

vi.mock('../../../src/client/rpc', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../../src/client/rpc')>()
  const OriginalRpcClient = mod.RpcClient
  return {
    ...mod,
    RpcClient: class extends OriginalRpcClient {
      constructor(endpoint: string, options?: ConstructorParameters<typeof OriginalRpcClient>[1]) {
        rpcCtorSpy(endpoint, options)
        super(endpoint, options)
      }
    },
  }
})

vi.mock('../../../src/client/evm-rpc', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../../src/client/evm-rpc')>()
  const OriginalEvmRpcClient = mod.EvmRpcClient
  return {
    ...mod,
    EvmRpcClient: class extends OriginalEvmRpcClient {
      constructor(
        endpoint: string,
        options?: ConstructorParameters<typeof OriginalEvmRpcClient>[1]
      ) {
        evmRpcCtorSpy(endpoint, options)
        super(endpoint, options)
      }
    },
  }
})

beforeEach(() => {
  rpcCtorSpy.mockClear()
  evmRpcCtorSpy.mockClear()
})

describe('ChainContext.rpc', () => {
  it('should throw when chainInfo has no rpc endpoint', () => {
    const chainInfo: ChainInfo = {
      chainId: 'test-1',
      chainName: 'test',
      chainType: 'initia' as const,
      network: 'testnet' as const,
    }

    const ctx = createChainContext(chainInfo)
    expect(() => ctx.rpc).toThrow('RPC not available')
  })

  it('should return RpcClient when rpc endpoint exists', () => {
    const chainInfo: ChainInfo = {
      chainId: 'interwoven-1',
      chainName: 'initia',
      chainType: 'initia' as const,
      network: 'mainnet' as const,
      rpc: 'https://rpc.initia.xyz',
    }

    const ctx = createChainContext(chainInfo)
    const rpc = ctx.rpc
    expect(rpc).toBeInstanceOf(RpcClient)
    // Same instance on second access (lazy singleton)
    expect(ctx.rpc).toBe(rpc)
  })

  it('should forward auth/headers/timeoutMs to RpcClient', () => {
    const chainInfo: ChainInfo = {
      chainId: 'interwoven-1',
      chainName: 'initia',
      chainType: 'initia' as const,
      network: 'mainnet' as const,
      rpc: 'https://rpc.initia.xyz',
    }

    const ctx = createChainContext(chainInfo, {
      auth: { type: 'api-key', key: 'test-key' },
      headers: { 'x-custom': 'value' },
      timeoutMs: 5000,
    })

    ctx.rpc // trigger lazy creation

    expect(rpcCtorSpy).toHaveBeenCalledWith('https://rpc.initia.xyz', {
      auth: { type: 'api-key', key: 'test-key' },
      headers: { 'x-custom': 'value' },
      timeoutMs: 5000,
    })
  })

  it('should forward auth/headers/timeoutMs to EvmRpcClient', () => {
    const chainInfo: ChainInfoForType<'minievm'> = {
      chainId: 'evm-1',
      chainName: 'evm',
      chainType: 'minievm',
      network: 'testnet',
      evmRpc: 'https://jsonrpc-evm-1.anvil.initia.xyz',
    }

    const ctx = createChainContext(chainInfo, {
      auth: { type: 'api-key', key: 'test-key' },
      headers: { 'x-custom': 'value' },
      timeoutMs: 5000,
    })

    ctx.evmRpc // trigger lazy creation

    expect(evmRpcCtorSpy).toHaveBeenCalledWith('https://jsonrpc-evm-1.anvil.initia.xyz', {
      auth: { type: 'api-key', key: 'test-key' },
      headers: { 'x-custom': 'value' },
      timeoutMs: 5000,
    })
  })

  it('should pass empty options when no auth/headers/timeoutMs', () => {
    const chainInfo: ChainInfo = {
      chainId: 'interwoven-1',
      chainName: 'initia',
      chainType: 'initia' as const,
      network: 'mainnet' as const,
      rpc: 'https://rpc.initia.xyz',
    }

    const ctx = createChainContext(chainInfo)
    ctx.rpc

    expect(rpcCtorSpy).toHaveBeenCalledWith('https://rpc.initia.xyz', {
      auth: undefined,
      headers: undefined,
      timeoutMs: undefined,
    })
  })
})

describe('withSigner/forAddress preserve carryover state', () => {
  const evmChainInfo: ChainInfoForType<'minievm'> = {
    chainId: 'evm-1',
    chainName: 'evm',
    chainType: 'minievm',
    network: 'testnet',
    evmRpc: 'https://jsonrpc-evm-1.anvil.initia.xyz',
    rpc: 'https://rpc.testnet.initia.xyz',
  }

  const mockSigner = {
    algorithm: 'secp256k1',
    getPublicKey: async () => new Uint8Array(33),
    getAddress: async () => 'init1test',
    sign: async () => new Uint8Array(64),
    signDirect: async () => ({}) as never,
  } as never

  it('withSigner should preserve evmTransport', () => {
    const ctx = createChainContext(evmChainInfo, { evmTransport: 'jsonrpc' })
    const derived = ctx.withSigner(mockSigner)
    expect(derived.evmTransport).toBe('jsonrpc')
  })

  it('withSigner should share pre-created RPC instances', () => {
    const ctx = createChainContext(evmChainInfo, { evmTransport: 'jsonrpc' })
    const rpc = ctx.rpc
    const evmRpc = ctx.evmRpc
    const derived = ctx.withSigner(mockSigner)
    expect(derived.rpc).toBe(rpc)
    expect(derived.evmRpc).toBe(evmRpc)
  })

  it('forAddress should preserve evmTransport and share RPC instances', () => {
    const ctx = createChainContext(evmChainInfo, { evmTransport: 'jsonrpc' })
    const rpc = ctx.rpc
    const evmRpc = ctx.evmRpc
    const derived = ctx.forAddress('init1abc')
    expect(derived.evmTransport).toBe('jsonrpc')
    expect(derived.rpc).toBe(rpc)
    expect(derived.evmRpc).toBe(evmRpc)
  })

  it('withSigner should forward rpcOptions when RPC not yet accessed', () => {
    const ctx = createChainContext(evmChainInfo, {
      auth: { type: 'api-key', key: 'test-key' },
      headers: { 'x-custom': 'value' },
      timeoutMs: 5000,
    })
    const derived = ctx.withSigner(mockSigner)
    rpcCtorSpy.mockClear()
    derived.rpc
    expect(rpcCtorSpy).toHaveBeenCalledWith('https://rpc.testnet.initia.xyz', {
      auth: { type: 'api-key', key: 'test-key' },
      headers: { 'x-custom': 'value' },
      timeoutMs: 5000,
    })
  })

  it('withSigner should preserve tokenResolver', () => {
    const mockResolver = vi.fn().mockReturnValue({
      getInfo: async () => ({ name: 'Test', symbol: 'TST', decimals: 6, totalSupply: '1000000' }),
    })
    const createCtxWithResolver = buildChainContextFactory(
      () => mockTransport,
      () => ({}),
      () => ({}) as never,
      { tokenResolver: mockResolver }
    )
    const ctx = createCtxWithResolver(evmChainInfo)
    expect(() => ctx.getTokenContract('uinit')).not.toThrow()
    const derived = ctx.withSigner(mockSigner)
    expect(() => derived.getTokenContract('uinit')).not.toThrow()
  })
})
