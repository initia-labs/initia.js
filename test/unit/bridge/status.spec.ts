/**
 * Unit tests for Bridge: withdrawal status determination.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConnectError, Code } from '@connectrpc/connect'
import { base64 } from '@scure/base'
import type { ChainInfo, ChainInfoProvider } from '../../../src/provider/types'
import type { TransportFactory } from '../../../src/client/transport-common'

// Hoist mock objects so they're available in vi.mock factory
const { mockOphost } = vi.hoisted(() => ({
  mockOphost: {
    bridge: vi.fn(),
    outputProposals: vi.fn(),
    outputProposal: vi.fn(),
    claimed: vi.fn(),
  },
}))

// Mock createGrpcClient and wrapClientWithCache to return our mock L1 client
vi.mock('../../../src/client/grpc-client', () => ({
  createGrpcClient: vi.fn(() => ({ ophost: mockOphost })),
}))

vi.mock('../../../src/client/cached-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/client/cached-client')>()
  return {
    ...actual,
    wrapClientWithCache: vi.fn((client: any) => client),
  }
})

// Must import Bridge AFTER vi.mock
import { Bridge } from '../../../src/bridge/bridge'

const mockCreateTransport: TransportFactory = vi.fn(() => ({}) as any)

/** Minimal mock provider. */
function createMockProvider(chains: ChainInfo[]): ChainInfoProvider {
  const map = new Map(chains.map(c => [c.chainId, c]))
  return {
    getChainInfo: (id: string) => map.get(id) as any,
    listChains: () => chains,
    hasChain: (id: string) => map.has(id),
  }
}

const l1Chain: ChainInfo = {
  chainId: 'initiation-2',
  chainName: 'Initia Testnet',
  chainType: 'initia',
  network: 'testnet',
}

const l2Chain: ChainInfo = {
  chainId: 'minimove-1',
  chainName: 'Minimove Testnet',
  chainType: 'minimove',
  network: 'testnet',
  opBridgeId: 3n,
  executorUri: 'https://executor.test.example.com',
}

const l2ChainNoExecutor: ChainInfo = {
  chainId: 'minimove-2',
  chainName: 'Minimove No Executor',
  chainType: 'minimove',
  network: 'testnet',
  opBridgeId: 4n,
}

/** Create a mock Executor API withdrawal object. */
function makeExecutorWithdrawal(overrides: Record<string, unknown> = {}) {
  return {
    sequence: 1,
    from: 'init1sender',
    to: 'init1receiver',
    amount: { denom: 'uinit', amount: '1000000' },
    output_index: 5,
    bridge_id: 3,
    withdrawal_proofs: [
      base64.encode(new TextEncoder().encode('proof1')),
      base64.encode(new TextEncoder().encode('proof2')),
    ],
    version: base64.encode(new Uint8Array([0x01])),
    storage_root: base64.encode(new TextEncoder().encode('storageroot12345678')),
    last_block_hash: base64.encode(new TextEncoder().encode('blockhash123456789')),
    tx_hash: 'abcdef1234567890',
    tx_time: '2024-01-01T00:00:00Z',
    tx_height: 100,
    ...overrides,
  }
}

/** Mock fetch to return a list of withdrawals. */
function mockFetchList(withdrawals: ReturnType<typeof makeExecutorWithdrawal>[]) {
  return {
    ok: true,
    json: () => Promise.resolve({ withdrawals }),
  }
}

/** Mock fetch to return a single withdrawal. */
function mockFetchSingle(withdrawal: ReturnType<typeof makeExecutorWithdrawal>) {
  return {
    ok: true,
    json: () => Promise.resolve(withdrawal),
  }
}

// 7 days in seconds (finalization period)
const SEVEN_DAYS_SECONDS = 604800n

describe('Bridge: Status Determination', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)

    // Default ophost mock responses
    mockOphost.bridge.mockResolvedValue({
      bridgeConfig: {
        finalizationPeriod: { seconds: SEVEN_DAYS_SECONDS, nanos: 0 },
      },
    })
    mockOphost.outputProposals.mockResolvedValue({
      outputProposals: [{ outputIndex: 10n }],
    })
    mockOphost.outputProposal.mockResolvedValue({
      outputProposal: {
        l1BlockTime: {
          // 30 days ago — well past finalization
          seconds: BigInt(Math.floor(Date.now() / 1000) - 30 * 86400),
          nanos: 0,
        },
      },
    })
    mockOphost.claimed.mockResolvedValue({ claimed: false })
  })

  describe('getWithdrawals', () => {
    it('should return empty array when no withdrawals', async () => {
      const provider = createMockProvider([l1Chain, l2Chain])
      const bridge = new Bridge(provider, mockCreateTransport)

      mockFetch.mockResolvedValueOnce(mockFetchList([]))

      const result = await bridge.getWithdrawals('minimove-1', 'init1address')
      expect(result).toEqual([])
      // No L1 queries should be made for empty list
      expect(mockOphost.bridge).not.toHaveBeenCalled()
    })

    it('should determine pending status (output not yet proposed)', async () => {
      const provider = createMockProvider([l1Chain, l2Chain])
      const bridge = new Bridge(provider, mockCreateTransport)

      // output_index=15 > latestProposed=10 → pending
      mockFetch.mockResolvedValueOnce(mockFetchList([makeExecutorWithdrawal({ output_index: 15 })]))

      const result = await bridge.getWithdrawals('minimove-1', 'init1address')
      expect(result).toHaveLength(1)
      expect(result[0].status).toEqual({ status: 'pending' })
      // No outputProposal or claimed queries for pending
      expect(mockOphost.outputProposal).not.toHaveBeenCalled()
      expect(mockOphost.claimed).not.toHaveBeenCalled()
    })

    it('should determine waiting status with correct claimableAt', async () => {
      const provider = createMockProvider([l1Chain, l2Chain])
      const bridge = new Bridge(provider, mockCreateTransport)

      const twoDaysAgoSeconds = BigInt(Math.floor(Date.now() / 1000) - 2 * 86400)

      mockFetch.mockResolvedValueOnce(mockFetchList([makeExecutorWithdrawal({ output_index: 5 })]))

      // Output proposed 2 days ago — within 7-day finalization
      mockOphost.outputProposal.mockResolvedValueOnce({
        outputProposal: {
          l1BlockTime: { seconds: twoDaysAgoSeconds, nanos: 0 },
        },
      })

      const result = await bridge.getWithdrawals('minimove-1', 'init1address')
      expect(result).toHaveLength(1)
      expect(result[0].status.status).toBe('waiting')

      if (result[0].status.status === 'waiting') {
        const expectedMs = Number(twoDaysAgoSeconds) * 1000 + Number(SEVEN_DAYS_SECONDS) * 1000
        expect(result[0].status.claimableAt.getTime()).toBe(expectedMs)
      }
      // No claimed query for waiting withdrawals
      expect(mockOphost.claimed).not.toHaveBeenCalled()
    })

    it('should determine claimable status (finalization passed, unclaimed)', async () => {
      const provider = createMockProvider([l1Chain, l2Chain])
      const bridge = new Bridge(provider, mockCreateTransport)

      mockFetch.mockResolvedValueOnce(mockFetchList([makeExecutorWithdrawal({ output_index: 5 })]))

      // Default mock: l1BlockTime 30 days ago → past finalization; claimed=false
      const result = await bridge.getWithdrawals('minimove-1', 'init1address')
      expect(result).toHaveLength(1)
      expect(result[0].status).toEqual({ status: 'claimable' })
      expect(mockOphost.claimed).toHaveBeenCalledOnce()
    })

    it('should determine claimed status', async () => {
      const provider = createMockProvider([l1Chain, l2Chain])
      const bridge = new Bridge(provider, mockCreateTransport)

      mockFetch.mockResolvedValueOnce(mockFetchList([makeExecutorWithdrawal({ output_index: 5 })]))

      mockOphost.claimed.mockResolvedValueOnce({ claimed: true })

      const result = await bridge.getWithdrawals('minimove-1', 'init1address')
      expect(result).toHaveLength(1)
      expect(result[0].status).toEqual({ status: 'claimed' })
    })

    it('should deduplicate outputIndex queries', async () => {
      const provider = createMockProvider([l1Chain, l2Chain])
      const bridge = new Bridge(provider, mockCreateTransport)

      // 3 withdrawals with the same output_index=5
      mockFetch.mockResolvedValueOnce(
        mockFetchList([
          makeExecutorWithdrawal({ sequence: 1, output_index: 5 }),
          makeExecutorWithdrawal({ sequence: 2, output_index: 5 }),
          makeExecutorWithdrawal({ sequence: 3, output_index: 5 }),
        ])
      )

      const result = await bridge.getWithdrawals('minimove-1', 'init1address')
      expect(result).toHaveLength(3)

      // outputProposal should be called only ONCE (deduplicated by outputIndex)
      expect(mockOphost.outputProposal).toHaveBeenCalledOnce()

      // claimed should be called 3 times (one per withdrawal, all past finalization)
      expect(mockOphost.claimed).toHaveBeenCalledTimes(3)
    })

    it('should only query claimed for claimable withdrawals (not pending/waiting)', async () => {
      const provider = createMockProvider([l1Chain, l2Chain])
      const bridge = new Bridge(provider, mockCreateTransport)

      // pending (output_index=15 > latestProposed=10) and claimable (output_index=5)
      mockFetch.mockResolvedValueOnce(
        mockFetchList([
          makeExecutorWithdrawal({ sequence: 1, output_index: 15 }),
          makeExecutorWithdrawal({ sequence: 2, output_index: 5 }),
        ])
      )

      const result = await bridge.getWithdrawals('minimove-1', 'init1address')
      expect(result).toHaveLength(2)
      expect(result[0].status.status).toBe('pending')
      expect(result[1].status.status).toBe('claimable')

      // outputProposal called only for output_index=5 (not 15 — it's beyond proposed)
      expect(mockOphost.outputProposal).toHaveBeenCalledOnce()
      // claimed called only for claimable withdrawal
      expect(mockOphost.claimed).toHaveBeenCalledOnce()
    })

    it('should propagate non-NotFound gRPC errors from outputProposal', async () => {
      const provider = createMockProvider([l1Chain, l2Chain])
      const bridge = new Bridge(provider, mockCreateTransport)

      mockFetch.mockResolvedValueOnce(mockFetchList([makeExecutorWithdrawal({ output_index: 5 })]))

      // Non-NotFound error must propagate, not be silently swallowed
      mockOphost.outputProposal.mockRejectedValueOnce(
        new ConnectError('internal server error', Code.Internal)
      )

      await expect(bridge.getWithdrawals('minimove-1', 'init1address')).rejects.toThrow(
        ConnectError
      )
    })

    it('should throw for missing executorUri', async () => {
      const provider = createMockProvider([l1Chain, l2ChainNoExecutor])
      const bridge = new Bridge(provider, mockCreateTransport)

      await expect(bridge.getWithdrawals('minimove-2', 'init1address')).rejects.toThrow(
        'does not have an executorUri'
      )
    })

    it('should throw when L1 chain not found in provider', async () => {
      // Provider with only L2 chain (no L1)
      const provider = createMockProvider([l2Chain])
      const bridge = new Bridge(provider, mockCreateTransport)

      mockFetch.mockResolvedValueOnce(mockFetchList([makeExecutorWithdrawal()]))

      await expect(bridge.getWithdrawals('minimove-1', 'init1address')).rejects.toThrow(
        'L1 (initia) chain not found in provider'
      )
    })
  })

  describe('getWithdrawalStatus', () => {
    it('should determine status for a single withdrawal', async () => {
      const provider = createMockProvider([l1Chain, l2Chain])
      const bridge = new Bridge(provider, mockCreateTransport)

      mockFetch.mockResolvedValueOnce(
        mockFetchSingle(makeExecutorWithdrawal({ output_index: 5, sequence: 42 }))
      )

      mockOphost.claimed.mockResolvedValueOnce({ claimed: true })

      const result = await bridge.getWithdrawalStatus('minimove-1', 42n)
      expect(result.status).toEqual({ status: 'claimed' })
      expect(result.sequence).toBe(42n)
    })

    it('should return pending for output not found', async () => {
      const provider = createMockProvider([l1Chain, l2Chain])
      const bridge = new Bridge(provider, mockCreateTransport)

      mockFetch.mockResolvedValueOnce(mockFetchSingle(makeExecutorWithdrawal({ output_index: 5 })))

      // outputProposal fails — output not found
      mockOphost.outputProposal.mockRejectedValueOnce(new ConnectError('not found', Code.NotFound))

      const result = await bridge.getWithdrawalStatus('minimove-1', 1n)
      expect(result.status).toEqual({ status: 'pending' })
    })

    it('should propagate non-NotFound gRPC errors', async () => {
      const provider = createMockProvider([l1Chain, l2Chain])
      const bridge = new Bridge(provider, mockCreateTransport)

      mockFetch.mockResolvedValueOnce(mockFetchSingle(makeExecutorWithdrawal({ output_index: 5 })))

      mockOphost.outputProposal.mockRejectedValueOnce(
        new ConnectError('internal server error', Code.Internal)
      )

      await expect(bridge.getWithdrawalStatus('minimove-1', 1n)).rejects.toThrow(ConnectError)
    })

    it('should throw for missing executorUri', async () => {
      const provider = createMockProvider([l1Chain, l2ChainNoExecutor])
      const bridge = new Bridge(provider, mockCreateTransport)

      await expect(bridge.getWithdrawalStatus('minimove-2', 1n)).rejects.toThrow(
        'does not have an executorUri'
      )
    })
  })
})
