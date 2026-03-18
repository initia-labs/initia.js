/**
 * Unit tests for Bridge.signOpHook().
 *
 * signOpHook builds a full Cosmos TxRaw from OP Hook messages:
 * - Parses CosmosMsgJson[] into Message[]
 * - Resolves sign mode (eip191 > direct > amino)
 * - Queries account (handles not-found for first deposit)
 * - Builds UnsignedTx, signs via ChainContext, returns base64
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Bridge } from '../../../src/bridge/bridge'
import { InitiaError } from '../../../src/errors'
import { ConnectError, Code } from '@connectrpc/connect'
import type { ChainInfo, ChainInfoProvider } from '../../../src/provider/types'
import type { OpHookResult } from '../../../src/bridge/types'
import type { DirectSigner, AminoSigner, EIP191Signer, Signer } from '../../../src/signer/types'

// =============================================================================
// Mocks
// =============================================================================

// Mock resolveRegistry — returns a registry with getMessage()
const mockGetMessage = vi.fn()
vi.mock('../../../src/chains/resolve', () => ({
  resolveRegistry: () => ({ getMessage: mockGetMessage }),
  resolveServices: () => ({}),
  resolveMsgs: () => ({}),
}))

// Mock buildChainContextFactory — returns a factory that creates a mock ChainContext
const mockSign = vi.fn()
const mockGetAccount = vi.fn()
vi.mock('../../../src/wallet/chain-context', () => ({
  buildChainContextFactory: () => () => ({
    sign: mockSign,
    getAccount: mockGetAccount,
  }),
}))

// Mock fromJson — pass through the parsed JSON
vi.mock('@bufbuild/protobuf', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@bufbuild/protobuf')>()
  return {
    ...actual,
    fromJson: (_schema: unknown, parsed: unknown) => parsed,
  }
})

// Mock Message constructor
vi.mock('../../../src/msgs', () => ({
  Message: class MockMessage {
    constructor(
      public schema: unknown,
      public value: unknown,
    ) {}
  },
}))

// =============================================================================
// Helpers
// =============================================================================

const l2Chain: ChainInfo = {
  chainId: 'minievm-1',
  chainName: 'Minievm',
  chainType: 'minievm',
  network: 'testnet',
  bech32Prefix: 'init',
}

function createMockProvider(): ChainInfoProvider {
  return {
    getChainInfo: (id: string) => (id === l2Chain.chainId ? l2Chain : undefined) as any,
    listChains: () => [l2Chain],
    hasChain: (id: string) => id === l2Chain.chainId,
  }
}

function createHookResult(overrides?: Partial<OpHookResult>): OpHookResult {
  return {
    chainId: 'minievm-1',
    hook: [
      {
        msg_type_url: '/minievm.evm.v1.MsgCall',
        msg: JSON.stringify({ sender: 'init1abc', contract_addr: '0x123', input: '0x' }),
      },
    ],
    ...overrides,
  }
}

/** Minimal DirectSigner */
function createDirectSigner(): DirectSigner {
  return {
    algorithm: 'eth_secp256k1',
    getPublicKey: async () => new Uint8Array(33),
    getAddress: async () => 'init1testaddr',
    signDirect: vi.fn(),
  }
}

/** Minimal AminoSigner (no signDirect) */
function createAminoOnlySigner(): AminoSigner {
  return {
    algorithm: 'eth_secp256k1',
    getPublicKey: async () => new Uint8Array(33),
    getAddress: async () => 'init1testaddr',
    signAmino: vi.fn(),
  }
}

/** Signer with EIP191 support */
function createEIP191Signer(): DirectSigner & EIP191Signer {
  return {
    algorithm: 'eth_secp256k1',
    getPublicKey: async () => new Uint8Array(33),
    getAddress: async () => 'init1testaddr',
    signDirect: vi.fn(),
    signPersonal: vi.fn(),
  }
}

/** Bare signer with no signing methods */
function createBareSigner(): Signer {
  return {
    algorithm: 'eth_secp256k1',
    getPublicKey: async () => new Uint8Array(33),
    getAddress: async () => 'init1testaddr',
  }
}

const FAKE_TX_BYTES = new Uint8Array([1, 2, 3, 4])

// =============================================================================
// Tests
// =============================================================================

describe('Bridge.signOpHook', () => {
  let bridge: Bridge

  beforeEach(() => {
    vi.clearAllMocks()
    bridge = new Bridge(createMockProvider(), (() => ({})) as any, 'https://router.test')

    // Default: registry knows MsgCall, account exists, sign returns txBytes
    mockGetMessage.mockReturnValue({ typeName: 'minievm.evm.v1.MsgCall' })
    mockGetAccount.mockResolvedValue({ address: 'init1testaddr', number: 5n, sequence: 3n })
    mockSign.mockResolvedValue({ txBytes: FAKE_TX_BYTES })
  })

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it('should parse hook messages, sign, and return base64', async () => {
    const result = await bridge.signOpHook(createHookResult(), createDirectSigner())

    expect(result.signer).toBe('init1testaddr')
    expect(typeof result.hook).toBe('string')
    // hook should be valid base64
    expect(() => atob(result.hook)).not.toThrow()
    expect(mockSign).toHaveBeenCalledOnce()
  })

  it('should pass correct UnsignedTx fields to ctx.sign()', async () => {
    await bridge.signOpHook(createHookResult(), createDirectSigner())

    const unsignedTx = mockSign.mock.calls[0][0]
    expect(unsignedTx.chainId).toBe('minievm-1')
    expect(unsignedTx.accountNumber).toBe(5n)
    expect(unsignedTx.sequence).toBe(3n)
    expect(unsignedTx.msgs).toHaveLength(1)
    expect(unsignedTx.signMode).toBe('direct')
  })

  // ---------------------------------------------------------------------------
  // Sign mode auto-detection
  // ---------------------------------------------------------------------------

  it('should prefer eip191 when signer supports signPersonal', async () => {
    await bridge.signOpHook(createHookResult(), createEIP191Signer())

    const unsignedTx = mockSign.mock.calls[0][0]
    expect(unsignedTx.signMode).toBe('eip191')
  })

  it('should fall back to direct when signer has signDirect but no signPersonal', async () => {
    await bridge.signOpHook(createHookResult(), createDirectSigner())

    const unsignedTx = mockSign.mock.calls[0][0]
    expect(unsignedTx.signMode).toBe('direct')
  })

  it('should fall back to amino when signer only has signAmino', async () => {
    await bridge.signOpHook(createHookResult(), createAminoOnlySigner())

    const unsignedTx = mockSign.mock.calls[0][0]
    expect(unsignedTx.signMode).toBe('amino')
  })

  it('should use explicit signMode override', async () => {
    await bridge.signOpHook(createHookResult(), createDirectSigner(), { signMode: 'direct' })

    const unsignedTx = mockSign.mock.calls[0][0]
    expect(unsignedTx.signMode).toBe('direct')
  })

  it('should throw when signMode override is incompatible with signer', async () => {
    // EIP191Signer has signDirect but no signAmino
    await expect(
      bridge.signOpHook(createHookResult(), createEIP191Signer(), { signMode: 'amino' })
    ).rejects.toThrow('signMode "amino" requires a signer that implements signAmino')
  })

  it('should throw for signer with no signing methods', async () => {
    await expect(
      bridge.signOpHook(createHookResult(), createBareSigner())
    ).rejects.toThrow('Signer must support signDirect, signAmino, or signPersonal')
  })

  // ---------------------------------------------------------------------------
  // Account query behavior
  // ---------------------------------------------------------------------------

  it('should use defaults (0n) when account is not found (first deposit)', async () => {
    mockGetAccount.mockRejectedValue(new ConnectError('account not found', Code.NotFound))

    await bridge.signOpHook(createHookResult(), createDirectSigner())

    const unsignedTx = mockSign.mock.calls[0][0]
    expect(unsignedTx.accountNumber).toBe(0n)
    expect(unsignedTx.sequence).toBe(0n)
  })

  it('should re-throw non-NotFound gRPC errors', async () => {
    mockGetAccount.mockRejectedValue(new ConnectError('service unavailable', Code.Unavailable))

    await expect(
      bridge.signOpHook(createHookResult(), createDirectSigner())
    ).rejects.toThrow(ConnectError)
  })

  it('should re-throw network errors', async () => {
    mockGetAccount.mockRejectedValue(new Error('ECONNREFUSED'))

    await expect(
      bridge.signOpHook(createHookResult(), createDirectSigner())
    ).rejects.toThrow('ECONNREFUSED')
  })

  // ---------------------------------------------------------------------------
  // Same-chain hook: sequence += 2
  // ---------------------------------------------------------------------------

  it('should increment sequence by 2 when sourceChainId matches hook chainId', async () => {
    await bridge.signOpHook(createHookResult(), createDirectSigner(), {
      sourceChainId: 'minievm-1',
    })

    const unsignedTx = mockSign.mock.calls[0][0]
    expect(unsignedTx.sequence).toBe(5n) // 3 + 2
  })

  it('should NOT increment sequence when sourceChainId differs', async () => {
    await bridge.signOpHook(createHookResult(), createDirectSigner(), {
      sourceChainId: 'initiation-2',
    })

    const unsignedTx = mockSign.mock.calls[0][0]
    expect(unsignedTx.sequence).toBe(3n)
  })

  it('should increment from 0n when account not found AND same-chain', async () => {
    mockGetAccount.mockRejectedValue(new ConnectError('not found', Code.NotFound))

    await bridge.signOpHook(createHookResult(), createDirectSigner(), {
      sourceChainId: 'minievm-1',
    })

    const unsignedTx = mockSign.mock.calls[0][0]
    expect(unsignedTx.sequence).toBe(2n) // 0 + 2
  })

  // ---------------------------------------------------------------------------
  // Error handling: invalid hook data
  // ---------------------------------------------------------------------------

  it('should throw InitiaError for invalid JSON in hook message', async () => {
    const hookResult = createHookResult({
      hook: [{ msg_type_url: '/minievm.evm.v1.MsgCall', msg: '{invalid json' }],
    })

    await expect(
      bridge.signOpHook(hookResult, createDirectSigner())
    ).rejects.toThrow(InitiaError)
  })

  it('should include typeUrl in JSON parse error message', async () => {
    const hookResult = createHookResult({
      hook: [{ msg_type_url: '/minievm.evm.v1.MsgCall', msg: 'not json' }],
    })

    await expect(
      bridge.signOpHook(hookResult, createDirectSigner())
    ).rejects.toThrow('/minievm.evm.v1.MsgCall')
  })

  it('should throw InitiaError for unknown message type', async () => {
    mockGetMessage.mockReturnValue(undefined)

    await expect(
      bridge.signOpHook(createHookResult(), createDirectSigner())
    ).rejects.toThrow('Unknown message type')
  })

  it('should throw InitiaError for unknown chain', async () => {
    const hookResult = createHookResult({ chainId: 'unknown-chain' })

    await expect(
      bridge.signOpHook(hookResult, createDirectSigner())
    ).rejects.toThrow('Chain not found')
  })

  // ---------------------------------------------------------------------------
  // Multiple hook messages
  // ---------------------------------------------------------------------------

  it('should handle multiple hook messages', async () => {
    const hookResult = createHookResult({
      hook: [
        { msg_type_url: '/minievm.evm.v1.MsgCall', msg: '{"a":1}' },
        { msg_type_url: '/minievm.evm.v1.MsgCall', msg: '{"b":2}' },
      ],
    })

    await bridge.signOpHook(hookResult, createDirectSigner())

    const unsignedTx = mockSign.mock.calls[0][0]
    expect(unsignedTx.msgs).toHaveLength(2)
  })
})
