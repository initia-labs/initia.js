import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TimeoutError } from '../../../src/errors'
import { parseTxEvents } from '../../../src/bridge/watch'
import type { WsTxResult } from '../../../src/client/websocket'
import type { ChainInfoProvider, ChainInfo } from '../../../src/provider/types'
import type { TransportFactory } from '../../../src/client/transport-common'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Track subscribe callbacks per session instance so we can fire events manually
type SubscribeCallback = (data: unknown) => void
const subscribeCallbacks: SubscribeCallback[] = []

vi.mock('../../../src/client/websocket/session', () => ({
  createSession: vi.fn(() => ({
    subscribe: vi.fn(async (_spec: unknown, cb: SubscribeCallback) => {
      subscribeCallbacks.push(cb)
      return { id: `sub-${subscribeCallbacks.length}`, unsubscribe: vi.fn() }
    }),
    close: vi.fn(),
  })),
}))

// Mock createGrpcClient and wrapClientWithCache
vi.mock('../../../src/client/grpc-client', () => ({
  createGrpcClient: vi.fn(() => ({
    ophost: {
      bridge: vi.fn().mockResolvedValue({
        bridgeConfig: {
          finalizationPeriod: { seconds: 3600n, nanos: 0 },
        },
      }),
    },
  })),
}))

vi.mock('../../../src/client/cached-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/client/cached-client')>()
  return {
    ...actual,
    wrapClientWithCache: vi.fn((client: any) => client),
  }
})

const mockCreateTransport: TransportFactory = vi.fn(() => ({}) as any)

// ---------------------------------------------------------------------------
// Helpers reused by the original parseTxEvents tests
// ---------------------------------------------------------------------------

function makeTxResult(
  events: Array<{ type: string; attributes: Array<{ key: string; value: string }> }>
): WsTxResult {
  return {
    height: '100',
    tx: 'abc123',
    result: { code: 0, log: '', gas_wanted: '100000', gas_used: '80000', events },
  }
}

// ---------------------------------------------------------------------------
// parseTxEvents tests (existing)
// ---------------------------------------------------------------------------

describe('parseTxEvents', () => {
  it('should extract initiate_token_deposit attributes', () => {
    const tx = makeTxResult([
      {
        type: 'initiate_token_deposit',
        attributes: [
          { key: 'bridge_id', value: '1' },
          { key: 'l1_sequence', value: '42' },
          { key: 'from', value: 'init1sender' },
          { key: 'to', value: 'init1recipient' },
          { key: 'amount', value: '1000000' },
        ],
      },
    ])
    const events = parseTxEvents(tx, 'initiate_token_deposit')
    expect(events).toHaveLength(1)
    expect(events[0].bridge_id).toBe('1')
    expect(events[0].l1_sequence).toBe('42')
  })

  it('should return empty array for no matching events', () => {
    const tx = makeTxResult([{ type: 'transfer', attributes: [{ key: 'sender', value: 'x' }] }])
    expect(parseTxEvents(tx, 'initiate_token_deposit')).toHaveLength(0)
  })

  it('should handle multiple matching events', () => {
    const tx = makeTxResult([
      { type: 'initiate_token_deposit', attributes: [{ key: 'l1_sequence', value: '1' }] },
      { type: 'transfer', attributes: [{ key: 'sender', value: 'x' }] },
      { type: 'initiate_token_deposit', attributes: [{ key: 'l1_sequence', value: '2' }] },
    ])
    const events = parseTxEvents(tx, 'initiate_token_deposit')
    expect(events).toHaveLength(2)
    expect(events[0].l1_sequence).toBe('1')
    expect(events[1].l1_sequence).toBe('2')
  })
})

// ---------------------------------------------------------------------------
// Mock-based tests for watch functions
// ---------------------------------------------------------------------------

// Lazy imports — must be after vi.mock declarations
const { watchDeposit, watchWithdrawal, waitForDeposit, waitForClaimable } =
  await import('../../../src/bridge/watch')

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const l1Info: ChainInfo = {
  chainId: 'initiation-2',
  chainName: 'Initia Testnet',
  chainType: 'initia',
  network: 'testnet',
  wss: 'wss://rpc.testnet.initia.xyz/websocket',
}

const l2Info: ChainInfo = {
  chainId: 'minimove-1',
  chainName: 'MiniMove',
  chainType: 'minimove',
  network: 'testnet',
  wss: 'wss://rpc.minimove.testnet/websocket',
  opBridgeId: 1n,
}

const mockProvider: ChainInfoProvider = {
  getChainInfo: ((id: string) => {
    if (id === 'minimove-1') return l2Info
    if (id === 'initiation-2') return l1Info
    return undefined
  }) as ChainInfoProvider['getChainInfo'],
  listChains: () => [l1Info, l2Info],
  hasChain: (id: string) => id === 'minimove-1' || id === 'initiation-2',
}

// ---------------------------------------------------------------------------
// Event factory helpers
// ---------------------------------------------------------------------------

function makeDepositInitiatedTx(seq: string): WsTxResult {
  return {
    height: '100',
    result: {
      code: 0,
      events: [
        {
          type: 'initiate_token_deposit',
          attributes: [
            { key: 'bridge_id', value: '1' },
            { key: 'l1_sequence', value: seq },
            { key: 'from', value: 'init1sender' },
            { key: 'to', value: 'init1recipient' },
            { key: 'amount', value: '1000000' },
          ],
        },
      ],
    },
  }
}

function makeDepositFinalizedTx(seq: string): WsTxResult {
  return {
    height: '200',
    result: {
      code: 0,
      events: [
        {
          type: 'finalize_token_deposit',
          attributes: [
            { key: 'l1_sequence', value: seq },
            { key: 'sender', value: 'init1sender' },
            { key: 'recipient', value: 'init1recipient' },
            { key: 'amount', value: '1000000' },
            { key: 'success', value: 'true' },
          ],
        },
      ],
    },
  }
}

function makeWithdrawalInitiatedTx(seq: string): WsTxResult {
  return {
    height: '100',
    result: {
      code: 0,
      events: [
        {
          type: 'initiate_token_withdrawal',
          attributes: [
            { key: 'from', value: 'init1sender' },
            { key: 'to', value: 'init1recipient' },
            { key: 'amount', value: '500000' },
            { key: 'l2_sequence', value: seq },
          ],
        },
      ],
    },
  }
}

function makeProposeOutputTx(bridgeId: string): WsTxResult {
  return {
    height: '300',
    result: {
      code: 0,
      events: [
        {
          type: 'propose_output',
          attributes: [
            { key: 'bridge_id', value: bridgeId },
            { key: 'output_index', value: '5' },
            { key: 'l2_block_number', value: '1000' },
          ],
        },
      ],
    },
  }
}

function makeClaimedTx(seq: string): WsTxResult {
  return {
    height: '400',
    result: {
      code: 0,
      events: [
        {
          type: 'finalize_token_withdrawal',
          attributes: [
            { key: 'bridge_id', value: '1' },
            { key: 'l2_sequence', value: seq },
            { key: 'from', value: 'init1sender' },
            { key: 'to', value: 'init1recipient' },
            { key: 'amount', value: '500000' },
          ],
        },
      ],
    },
  }
}

// ---------------------------------------------------------------------------
// watchDeposit
// ---------------------------------------------------------------------------

describe('watchDeposit', () => {
  beforeEach(() => {
    subscribeCallbacks.length = 0
  })

  it('should emit initiated event from L1 subscription', async () => {
    const events: unknown[] = []
    watchDeposit(mockProvider, { l2ChainId: 'minimove-1', l1Sequence: 42n }, e => events.push(e))

    // Wait for async subscribe calls to complete
    await new Promise(r => setTimeout(r, 10))

    // First callback is L1 subscription (initiate_token_deposit)
    expect(subscribeCallbacks.length).toBeGreaterThanOrEqual(1)
    subscribeCallbacks[0](makeDepositInitiatedTx('42'))

    expect(events).toHaveLength(1)
    expect(events[0]).toEqual(expect.objectContaining({ status: 'initiated', l1Sequence: 42n }))
  })

  it('should emit finalized event from L2 subscription', async () => {
    const events: unknown[] = []
    watchDeposit(mockProvider, { l2ChainId: 'minimove-1', l1Sequence: 42n }, e => events.push(e))

    await new Promise(r => setTimeout(r, 10))

    // Second callback is L2 subscription (finalize_token_deposit)
    expect(subscribeCallbacks.length).toBeGreaterThanOrEqual(2)
    subscribeCallbacks[1](makeDepositFinalizedTx('42'))

    expect(events).toHaveLength(1)
    expect(events[0]).toEqual(
      expect.objectContaining({ status: 'finalized', l1Sequence: 42n, success: true })
    )
  })

  it('should filter by l1Sequence', async () => {
    const events: unknown[] = []
    watchDeposit(mockProvider, { l2ChainId: 'minimove-1', l1Sequence: 42n }, e => events.push(e))

    await new Promise(r => setTimeout(r, 10))

    // Send event with wrong sequence — must be ignored
    subscribeCallbacks[0](makeDepositInitiatedTx('99'))
    expect(events).toHaveLength(0)

    // Send event with correct sequence
    subscribeCallbacks[0](makeDepositInitiatedTx('42'))
    expect(events).toHaveLength(1)
  })

  it('should throw if L2 has no wss endpoint', () => {
    const noWssProvider: ChainInfoProvider = {
      ...mockProvider,
      getChainInfo: ((id: string) => {
        if (id === 'minimove-1') return { ...l2Info, wss: undefined }
        return mockProvider.getChainInfo(id)
      }) as ChainInfoProvider['getChainInfo'],
    }

    expect(() => watchDeposit(noWssProvider, { l2ChainId: 'minimove-1' }, vi.fn())).toThrow()
  })
})

// ---------------------------------------------------------------------------
// watchWithdrawal
// ---------------------------------------------------------------------------

describe('watchWithdrawal', () => {
  beforeEach(() => {
    subscribeCallbacks.length = 0
  })

  it('should emit initiated event from L2 subscription', async () => {
    const events: unknown[] = []
    watchWithdrawal(mockProvider, { l2ChainId: 'minimove-1', l2Sequence: 10n }, e => events.push(e), mockCreateTransport)

    await new Promise(r => setTimeout(r, 10))

    // First callback is L2 (initiate_token_withdrawal)
    subscribeCallbacks[0](makeWithdrawalInitiatedTx('10'))

    expect(events).toHaveLength(1)
    expect(events[0]).toEqual(expect.objectContaining({ status: 'initiated', l2Sequence: 10n }))
  })

  it('should emit proposed event from L1 propose_output', async () => {
    const events: unknown[] = []
    watchWithdrawal(mockProvider, { l2ChainId: 'minimove-1', l2Sequence: 10n }, e => events.push(e), mockCreateTransport)

    // Extra time for the async finalization period fetch to settle
    await new Promise(r => setTimeout(r, 50))

    // Second callback is L1 propose_output
    expect(subscribeCallbacks.length).toBeGreaterThanOrEqual(2)
    subscribeCallbacks[1](makeProposeOutputTx('1'))

    expect(events.some((e: any) => e.status === 'proposed')).toBe(true)
  })

  it('should emit claimed event from L1 finalize_token_withdrawal', async () => {
    const events: unknown[] = []
    watchWithdrawal(mockProvider, { l2ChainId: 'minimove-1', l2Sequence: 10n }, e => events.push(e), mockCreateTransport)

    await new Promise(r => setTimeout(r, 10))

    // Third callback is L1 finalize_token_withdrawal
    expect(subscribeCallbacks.length).toBeGreaterThanOrEqual(3)
    subscribeCallbacks[2](makeClaimedTx('10'))

    expect(events).toHaveLength(1)
    expect(events[0]).toEqual(expect.objectContaining({ status: 'claimed', l2Sequence: 10n }))
  })
})

// ---------------------------------------------------------------------------
// waitForDeposit (Promise wrapper)
// ---------------------------------------------------------------------------

describe('waitForDeposit', () => {
  beforeEach(() => {
    subscribeCallbacks.length = 0
  })

  it('should resolve when finalized event is received', async () => {
    const promise = waitForDeposit(mockProvider, {
      l2ChainId: 'minimove-1',
      l1Sequence: 42n,
      timeout: 5000,
    })

    await new Promise(r => setTimeout(r, 10))

    // Trigger finalized event on L2 subscription (second callback)
    subscribeCallbacks[1](makeDepositFinalizedTx('42'))

    const result = await promise
    expect(result.status).toBe('finalized')
    expect(result.l1Sequence).toBe(42n)
  })

  it('should reject on timeout with TimeoutError', async () => {
    await expect(
      waitForDeposit(mockProvider, { l2ChainId: 'minimove-1', l1Sequence: 999n, timeout: 50 })
    ).rejects.toThrow(TimeoutError)
  })

  it('should reject when onError is triggered by subscription failure', async () => {
    // Create a mock that rejects the subscribe promise to simulate WS failure
    const { createSession } = await import('../../../src/client/websocket/session')
    const mockedCreateSession = vi.mocked(createSession)

    // Make the L1 subscription fail
    mockedCreateSession.mockReturnValueOnce({
      subscribe: vi.fn().mockRejectedValueOnce(new Error('WebSocket connection failed')),
      close: vi.fn(),
    } as any)
    // L2 subscription succeeds
    mockedCreateSession.mockReturnValueOnce({
      subscribe: vi.fn(async (_spec: unknown, cb: SubscribeCallback) => {
        subscribeCallbacks.push(cb)
        return { id: 'sub-ok', unsubscribe: vi.fn() }
      }),
      close: vi.fn(),
    } as any)

    await expect(
      waitForDeposit(mockProvider, { l2ChainId: 'minimove-1', l1Sequence: 42n, timeout: 5000 })
    ).rejects.toThrow('WebSocket connection failed')
  })
})

// ---------------------------------------------------------------------------
// waitForClaimable (Promise wrapper)
// ---------------------------------------------------------------------------

describe('waitForClaimable', () => {
  beforeEach(() => {
    subscribeCallbacks.length = 0
  })

  it('should reject on timeout with TimeoutError', async () => {
    await expect(
      waitForClaimable(mockProvider, { l2ChainId: 'minimove-1', l2Sequence: 10n, timeout: 50 }, mockCreateTransport)
    ).rejects.toThrow(TimeoutError)
  })

  it('should not pass timeout to underlying watchWithdrawal', async () => {
    // waitForEvent should own timeout semantics, not duplicate with watchWithdrawal
    // If timeout IS passed through, watchWithdrawal's internal timeout would also fire,
    // causing double-timeout. We verify by checking that a short timeout results in
    // exactly one TimeoutError rejection (not double invocation of onError).
    const onErrorSpy = vi.fn()

    await expect(
      waitForClaimable(mockProvider, {
        l2ChainId: 'minimove-1',
        l2Sequence: 10n,
        timeout: 50,
        onError: onErrorSpy,
      }, mockCreateTransport)
    ).rejects.toThrow(TimeoutError)

    // onError should NOT be called by the underlying watcher's own timeout
    // (since timeout: undefined is passed to watchWithdrawal)
    expect(onErrorSpy).not.toHaveBeenCalled()
  })
})
