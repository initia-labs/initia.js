/**
 * Unit tests for waitForEvent and related utilities.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConnectError } from '@connectrpc/connect'
import {
  buildEventQuery,
  matchesEventFilter,
  waitForEvent,
  type EventFilter,
  type TxResult,
  type TxSearchClient,
} from '../../../src/client/websocket'
import type { ChainInfo } from '../../../src/provider/types'
import { TimeoutError } from '../../../src/errors'

describe('buildEventQuery', () => {
  it('should build query with single attribute', () => {
    const filter: EventFilter = {
      type: 'transfer',
      attributes: { recipient: 'init1abc123' },
    }
    const query = buildEventQuery(filter)
    expect(query).toBe("transfer.recipient='init1abc123'")
  })

  it('should build query with multiple attributes', () => {
    const filter: EventFilter = {
      type: 'transfer',
      attributes: { sender: 'init1sender', recipient: 'init1recipient' },
    }
    const query = buildEventQuery(filter)
    expect(query).toContain("transfer.sender='init1sender'")
    expect(query).toContain("transfer.recipient='init1recipient'")
    expect(query).toContain(' AND ')
  })

  it('should fallback to tx.height>0 when no attributes', () => {
    const filter: EventFilter = { type: 'transfer' }
    const query = buildEventQuery(filter)
    expect(query).toBe('tx.height>0')
  })

  it('should add fromHeight condition', () => {
    const filter: EventFilter = {
      type: 'transfer',
      attributes: { recipient: 'init1abc' },
    }
    const query = buildEventQuery(filter, 1000n)
    expect(query).toContain("transfer.recipient='init1abc'")
    expect(query).toContain('tx.height>=1000')
    expect(query).toContain(' AND ')
  })

  it('should add fromHeight with no attributes', () => {
    const filter: EventFilter = { type: 'message' }
    const query = buildEventQuery(filter, 500n)
    expect(query).toBe('tx.height>0 AND tx.height>=500')
  })
})

describe('matchesEventFilter', () => {
  const mockTxResult: TxResult = {
    txHash: '0x123',
    height: 1000n,
    code: 0,
    rawLog: 'success',
    gasUsed: 100000n,
    gasWanted: 150000n,
    events: [
      {
        type: 'message',
        attributes: [
          { key: 'action', value: '/cosmos.bank.v1beta1.MsgSend' },
          { key: 'sender', value: 'init1sender' },
        ],
      },
      {
        type: 'transfer',
        attributes: [
          { key: 'recipient', value: 'init1recipient' },
          { key: 'sender', value: 'init1sender' },
          { key: 'amount', value: '1000uinit' },
        ],
      },
      {
        type: 'coin_spent',
        attributes: [
          { key: 'spender', value: 'init1sender' },
          { key: 'amount', value: '1000uinit' },
        ],
      },
    ],
  }

  it('should match by event type only', () => {
    const filter: EventFilter = { type: 'transfer' }
    expect(matchesEventFilter(mockTxResult, filter)).toBe(true)
  })

  it('should match by event type with single attribute', () => {
    const filter: EventFilter = {
      type: 'transfer',
      attributes: { recipient: 'init1recipient' },
    }
    expect(matchesEventFilter(mockTxResult, filter)).toBe(true)
  })

  it('should match by event type with multiple attributes', () => {
    const filter: EventFilter = {
      type: 'transfer',
      attributes: {
        recipient: 'init1recipient',
        sender: 'init1sender',
      },
    }
    expect(matchesEventFilter(mockTxResult, filter)).toBe(true)
  })

  it('should not match when event type not found', () => {
    const filter: EventFilter = { type: 'staking' }
    expect(matchesEventFilter(mockTxResult, filter)).toBe(false)
  })

  it('should not match when attribute value does not match', () => {
    const filter: EventFilter = {
      type: 'transfer',
      attributes: { recipient: 'init1wrong' },
    }
    expect(matchesEventFilter(mockTxResult, filter)).toBe(false)
  })

  it('should not match when attribute key not found', () => {
    const filter: EventFilter = {
      type: 'transfer',
      attributes: { nonexistent: 'value' },
    }
    expect(matchesEventFilter(mockTxResult, filter)).toBe(false)
  })

  it('should match message action filter', () => {
    const filter: EventFilter = {
      type: 'message',
      attributes: { action: '/cosmos.bank.v1beta1.MsgSend' },
    }
    expect(matchesEventFilter(mockTxResult, filter)).toBe(true)
  })

  it('should handle empty events array', () => {
    const emptyTx: TxResult = {
      ...mockTxResult,
      events: [],
    }
    const filter: EventFilter = { type: 'transfer' }
    expect(matchesEventFilter(emptyTx, filter)).toBe(false)
  })

  it('should handle empty attributes object', () => {
    const filter: EventFilter = {
      type: 'transfer',
      attributes: {},
    }
    expect(matchesEventFilter(mockTxResult, filter)).toBe(true)
  })
})

describe('waitForEvent (Mock Tests)', () => {
  // Mock txResponse type matching GetTxsEventResponse.txResponses
  type MockTxResponse = {
    height: bigint
    txhash: string
    code: number
    rawLog: string
    gasUsed: bigint
    gasWanted: bigint
    events: Array<{ type: string; attributes: Array<{ key: string; value: string }> }>
  }

  const createMockClient = (txResponses: MockTxResponse[] = []): TxSearchClient =>
    ({
      tx: {
        getTx: vi.fn().mockResolvedValue({}),
        getTxsEvent: vi.fn().mockResolvedValue({
          txs: [],
          txResponses,
          total: BigInt(txResponses.length),
        }),
      },
    }) as unknown as TxSearchClient

  it('should return matching transactions from polling', async () => {
    const mockTxResponses = [
      {
        height: 1000n,
        txhash: '0xabc',
        code: 0,
        rawLog: 'success',
        gasUsed: 100000n,
        gasWanted: 150000n,
        events: [
          {
            type: 'transfer',
            attributes: [
              { key: 'recipient', value: 'init1recipient' },
              { key: 'amount', value: '1000uinit' },
            ],
          },
        ],
      },
    ]

    const client = createMockClient(mockTxResponses)
    const filter: EventFilter = {
      type: 'transfer',
      attributes: { recipient: 'init1recipient' },
    }

    const results = await waitForEvent(client, filter, {
      timeout: 5000,
      pollInterval: 100,
      maxResults: 1, // Return immediately when found
    })

    expect(results).toHaveLength(1)
    expect(results[0].txHash).toBe('0xabc')
    expect(results[0].height).toBe(1000n)
    expect(results[0].events).toHaveLength(1)
  })

  it('should filter out non-matching transactions', async () => {
    const mockTxResponses = [
      {
        height: 1000n,
        txhash: '0xmatch',
        code: 0,
        rawLog: 'success',
        gasUsed: 100000n,
        gasWanted: 150000n,
        events: [
          {
            type: 'transfer',
            attributes: [{ key: 'recipient', value: 'init1target' }],
          },
        ],
      },
      {
        height: 1001n,
        txhash: '0xnomatch',
        code: 0,
        rawLog: 'success',
        gasUsed: 100000n,
        gasWanted: 150000n,
        events: [
          {
            type: 'transfer',
            attributes: [{ key: 'recipient', value: 'init1other' }],
          },
        ],
      },
    ]

    const client = createMockClient(mockTxResponses)
    const filter: EventFilter = {
      type: 'transfer',
      attributes: { recipient: 'init1target' },
    }

    const results = await waitForEvent(client, filter, {
      timeout: 5000,
      pollInterval: 100,
      maxResults: 1, // Return immediately when found
    })

    expect(results).toHaveLength(1)
    expect(results[0].txHash).toBe('0xmatch')
  })

  it('should respect maxResults limit', async () => {
    const mockTxResponses = Array.from({ length: 10 }, (_, i) => ({
      height: BigInt(1000 + i),
      txhash: `0xtx${i}`,
      code: 0,
      rawLog: 'success',
      gasUsed: 100000n,
      gasWanted: 150000n,
      events: [
        {
          type: 'transfer',
          attributes: [{ key: 'recipient', value: 'init1recipient' }],
        },
      ],
    }))

    const client = createMockClient(mockTxResponses)
    const filter: EventFilter = { type: 'transfer' }

    const results = await waitForEvent(client, filter, {
      timeout: 5000,
      pollInterval: 100,
      maxResults: 3,
    })

    expect(results).toHaveLength(3)
    // Should be sorted by height ascending
    expect(results[0].height).toBe(1000n)
    expect(results[1].height).toBe(1001n)
    expect(results[2].height).toBe(1002n)
  })

  it('should throw TimeoutError when no matches found', async () => {
    const client = createMockClient([])
    const filter: EventFilter = { type: 'transfer' }

    await expect(
      waitForEvent(client, filter, {
        timeout: 500,
        pollInterval: 100,
      })
    ).rejects.toThrow(TimeoutError)
  })

  it('should return partial results on timeout', async () => {
    // First call returns results, subsequent calls return empty
    let callCount = 0
    const client: TxSearchClient = {
      tx: {
        getTx: vi.fn().mockResolvedValue({}),
        getTxsEvent: vi.fn().mockImplementation(() => {
          callCount++
          if (callCount === 1) {
            return Promise.resolve({
              txs: [],
              txResponses: [
                {
                  height: 1000n,
                  txhash: '0xfirst',
                  code: 0,
                  rawLog: 'success',
                  gasUsed: 100000n,
                  gasWanted: 150000n,
                  events: [
                    {
                      type: 'transfer',
                      attributes: [{ key: 'recipient', value: 'init1recipient' }],
                    },
                  ],
                },
              ],
              total: 1n,
            })
          }
          return Promise.resolve({ txs: [], txResponses: [], total: 0n })
        }),
      },
    }

    const filter: EventFilter = { type: 'transfer' }

    const results = await waitForEvent(client, filter, {
      timeout: 500,
      pollInterval: 100,
      maxResults: 10, // Looking for more than we'll get
    })

    // Should return what we have after timeout
    expect(results).toHaveLength(1)
    expect(results[0].txHash).toBe('0xfirst')
  })

  it('should pass correct query to getTxsEvent', async () => {
    const getTxsEventMock = vi.fn().mockResolvedValue({
      txs: [],
      txResponses: [],
      total: 0n,
    })

    const client: TxSearchClient = {
      tx: {
        getTx: vi.fn().mockResolvedValue({}),
        getTxsEvent: getTxsEventMock,
      },
    }

    const filter: EventFilter = {
      type: 'transfer',
      attributes: { recipient: 'init1abc' },
    }

    await expect(
      waitForEvent(client, filter, {
        timeout: 300,
        pollInterval: 100,
        fromHeight: 1000n,
      })
    ).rejects.toThrow(TimeoutError)

    expect(getTxsEventMock).toHaveBeenCalled()
    const calledQuery = getTxsEventMock.mock.calls[0][0].query
    expect(calledQuery).toContain("transfer.recipient='init1abc'")
    expect(calledQuery).toContain('tx.height>=1000')
  })
})

describe('waitForEvent (Real Network Tests)', () => {
  let initiaChainInfo: ChainInfo | undefined

  beforeEach(async () => {
    try {
      const { createRegistryProvider } = await import('../../../src/provider')
      const provider = await createRegistryProvider({ network: 'testnet' })
      initiaChainInfo = provider.getChainInfo('initiation-2')
    } catch {
      initiaChainInfo = undefined
    }
  })

  it('should find recent transactions via getTxsEvent', async () => {
    if (!initiaChainInfo?.grpc) {
      console.log('Skipping: Initia testnet not available')
      return
    }

    try {
      const { createClient } = await import('../../../src/entry.node')
      const client = createClient(initiaChainInfo) as TxSearchClient

      // Search for recent transactions - use message type which is common
      const results = await waitForEvent(
        client,
        { type: 'message' },
        {
          timeout: 15000,
          pollInterval: 1000,
          maxResults: 3,
        }
      )

      // May or may not find results depending on chain activity
      console.log(`Found ${results.length} transactions with 'message' events`)
      if (results.length > 0) {
        expect(results[0].txHash).toBeDefined()
        expect(results[0].height).toBeDefined()
        expect(results[0].events).toBeDefined()
      }
    } catch (error) {
      if (error instanceof TimeoutError || error instanceof ConnectError) {
        console.log('Skipping due to network/timeout error:', (error as Error).message)
        return
      }
      throw error
    }
  }, 60000)
})
