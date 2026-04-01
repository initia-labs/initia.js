/**
 * Tests for ctx.contract() method on ChainContext.
 *
 * Verifies:
 * 1. contract() dispatches to the correct VM-specific factory via resolver
 * 2. contract() throws when no resolver configured (matches typed factory error pattern)
 * 3. contract() is preserved across withSigner()/forAddress() derivations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ChainInfo } from '../../../src/provider/types'
import type { ChainType } from '../../../src/client/types'
import {
  buildChainContextFactory,
  type ChainContext,
  type ContractResolver,
} from '../../../src/wallet/chain-context'

// =============================================================================
// Mock Helpers
// =============================================================================

/** Minimal chainInfo for a minimove chain. */
function createMockChainInfo(chainType: ChainType = 'minimove'): ChainInfo {
  return {
    chainId: 'test-chain-1',
    chainName: 'test-chain',
    chainType,
    network: 'testnet',
    lcd: 'http://localhost:1317',
    rpc: 'http://localhost:26657',
    bech32Prefix: 'init',
    gasPrice: '0.15umin',
  } as ChainInfo
}

/** Stub transport creator — returns a minimal Transport. */
function createStubTransport() {
  return () =>
    ({
      // Transport is opaque to ChainContextImpl; the stub is never called
    }) as any
}

/** Stub services — returns minimal service descriptors. */
function createStubServices() {
  return () => ({})
}

/** Stub msgs — returns minimal message builders. */
function createStubMsgs() {
  return () =>
    ({
      decode: vi.fn(),
    }) as any
}

// =============================================================================
// Tests
// =============================================================================

describe('ctx.contract() method', () => {
  let mockChainInfo: ChainInfo
  let stubTransport: ReturnType<typeof createStubTransport>
  let stubServices: ReturnType<typeof createStubServices>
  let stubMsgs: ReturnType<typeof createStubMsgs>

  beforeEach(() => {
    mockChainInfo = createMockChainInfo('minimove')
    stubTransport = createStubTransport()
    stubServices = createStubServices()
    stubMsgs = createStubMsgs()
  })

  it('dispatches to the contract resolver on a minimove context', async () => {
    // Arrange: mock resolver returns a Promise (matches async Move overload)
    const fakeContract = { moduleAddress: '0x1', moduleName: 'coin', abi: {} }
    const contractResolver: ContractResolver = vi.fn().mockResolvedValue(fakeContract)

    const createCtx = buildChainContextFactory(stubTransport, stubServices, stubMsgs, {
      contractResolver,
    })

    const ctx = createCtx(mockChainInfo)

    // Act
    const result = await (ctx as ChainContext<'minimove'>).contract('0x1', 'coin')

    // Assert: resolver was called with (context, chainType, ...args)
    expect(contractResolver).toHaveBeenCalledTimes(1)
    const [ctxArg, chainTypeArg, ...restArgs] = (contractResolver as any).mock.calls[0]
    expect(chainTypeArg).toBe('minimove')
    expect(restArgs).toEqual(['0x1', 'coin'])
    // The context passed should be the ChainContextImpl (has client property)
    expect(ctxArg).toHaveProperty('client')
    expect(result).toBe(fakeContract)
  })

  it('throws when no contract resolver is configured', () => {
    // Arrange: no contractResolver passed
    const createCtx = buildChainContextFactory(stubTransport, stubServices, stubMsgs)

    const ctx = createCtx(mockChainInfo)

    // Act & Assert: matches the "typed factory" error pattern
    expect(() => (ctx as ChainContext<'minimove'>).contract('0x1', 'coin')).toThrow(/typed factory/)
  })

  it('preserves contract resolver across withSigner() derivation', async () => {
    const fakeContract = { execute: {}, view: {} }
    const contractResolver: ContractResolver = vi.fn().mockResolvedValue(fakeContract)

    const createCtx = buildChainContextFactory(stubTransport, stubServices, stubMsgs, {
      contractResolver,
    })

    const ctx = createCtx(mockChainInfo)
    const derived = ctx.withSigner({
      getAddress: async () => 'init1test',
      signDirect: async () => ({ signed: {} as any, signature: new Uint8Array() }),
    } as any)

    // contract() should still work on derived context
    const result = await (derived as ChainContext<'minimove'>).contract('0x1', 'coin')
    expect(contractResolver).toHaveBeenCalledTimes(1)
    expect(result).toBe(fakeContract)
  })

  it('preserves contract resolver across forAddress() derivation', async () => {
    const fakeContract = { execute: {}, view: {} }
    const contractResolver: ContractResolver = vi.fn().mockResolvedValue(fakeContract)

    const createCtx = buildChainContextFactory(stubTransport, stubServices, stubMsgs, {
      contractResolver,
    })

    const ctx = createCtx(mockChainInfo)
    const derived = ctx.forAddress('init1abc')

    const result = await (derived as ChainContext<'minimove'>).contract('0x1', 'coin')
    expect(contractResolver).toHaveBeenCalledTimes(1)
    expect(result).toBe(fakeContract)
  })

  it('passes all arguments through to the resolver for EVM chains', () => {
    const mockEvmChainInfo = createMockChainInfo('minievm')
    const fakeContract = { address: '0xabc', read: {}, write: {} }
    const contractResolver: ContractResolver = vi.fn().mockReturnValue(fakeContract)

    const createCtx = buildChainContextFactory(stubTransport, stubServices, stubMsgs, {
      contractResolver,
    })

    const ctx = createCtx(mockEvmChainInfo)
    const mockAbi = [{ type: 'function', name: 'transfer' }]
    const result = (ctx as ChainContext<'minievm'>).contract('0xabc', mockAbi as any)

    expect(contractResolver).toHaveBeenCalledWith(expect.anything(), 'minievm', '0xabc', mockAbi)
    expect(result).toBe(fakeContract)
  })
})
