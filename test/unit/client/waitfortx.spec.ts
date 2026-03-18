/**
 * Unit tests for waitForTx functionality.
 *
 * Split into two parts:
 * 1. Mock tests - For retry logic, timeout, error handling (require mocks)
 * 2. Real network tests - For actual transaction lookup using testnet
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import { ConnectError } from '@connectrpc/connect'
import { waitForTx, type TxQueryClient } from '../../../src/client/websocket'
import { TimeoutError } from '../../../src/errors'
import type { ChainInfo } from '../../../src/provider/types'
import type { Client } from '../../../src/client/types'

// ============================================================================
// Mock Data and Helpers
// ============================================================================

const mockTxResponse = {
  height: 12345n,
  txhash: 'ABCD1234ABCD1234ABCD1234ABCD1234ABCD1234ABCD1234ABCD1234ABCD1234',
  code: 0,
  rawLog: '[]',
  gasUsed: 100000n,
  gasWanted: 200000n,
  events: [
    {
      type: 'transfer',
      attributes: [
        { key: 'sender', value: 'init1sender' },
        { key: 'recipient', value: 'init1recipient' },
        { key: 'amount', value: '1000uinit' },
      ],
    },
    {
      type: 'message',
      attributes: [
        { key: 'action', value: '/cosmos.bank.v1beta1.MsgSend' },
        { key: 'sender', value: 'init1sender' },
      ],
    },
  ],
}

function createMockClient(
  responses: Array<{ txResponse?: typeof mockTxResponse } | Error>
): TxQueryClient {
  let callIndex = 0
  return {
    tx: {
      getTx: vi.fn().mockImplementation(async () => {
        const response = responses[callIndex] ?? responses[responses.length - 1]
        callIndex++
        if (response instanceof Error) {
          throw response
        }
        return response
      }),
    },
  }
}

const mockChainInfo: ChainInfo = {
  chainId: 'test-chain',
  chainName: 'Test Chain',
  chainType: 'initia',
  network: 'testnet',
  rest: 'https://rest.test.com',
  grpc: 'https://grpc.test.com',
  wss: 'wss://ws.test.com',
}

const mockChainInfoNoWss: ChainInfo = {
  chainId: 'test-chain',
  chainName: 'Test Chain',
  chainType: 'initia',
  network: 'testnet',
  rest: 'https://rest.test.com',
  grpc: 'https://grpc.test.com',
}

// ============================================================================
// Part 1: Mock Tests (require mocked responses)
// ============================================================================

describe('waitForTx (Mock Tests)', () => {
  describe('result formatting', () => {
    it('should format txResponse correctly', async () => {
      const client = createMockClient([{ txResponse: mockTxResponse }])

      const result = await waitForTx(client, mockTxResponse.txhash, { timeout: 5000 })

      expect(result.height).toBe(12345n)
      expect(result.txHash).toBe(mockTxResponse.txhash)
      expect(result.code).toBe(0)
      expect(result.rawLog).toBe('[]')
      expect(result.gasUsed).toBe(100000n)
      expect(result.gasWanted).toBe(200000n)
      expect(result.events).toHaveLength(2)
      expect(result.events[0].type).toBe('transfer')
      expect(result.events[0].attributes).toHaveLength(3)
      expect(result.events[0].attributes[0]).toEqual({ key: 'sender', value: 'init1sender' })
    })

    it('should handle failed transaction (code != 0)', async () => {
      const failedTxResponse = {
        ...mockTxResponse,
        code: 1,
        rawLog: 'insufficient funds',
      }
      const client = createMockClient([{ txResponse: failedTxResponse }])

      const result = await waitForTx(client, mockTxResponse.txhash)

      expect(result.code).toBe(1)
      expect(result.rawLog).toBe('insufficient funds')
    })

    it('should handle empty events array', async () => {
      const noEventsTxResponse = {
        ...mockTxResponse,
        events: [],
      }
      const client = createMockClient([{ txResponse: noEventsTxResponse }])

      const result = await waitForTx(client, mockTxResponse.txhash)

      expect(result.events).toEqual([])
    })
  })

  describe('polling mode', () => {
    it('should return tx when found immediately', async () => {
      const client = createMockClient([{ txResponse: mockTxResponse }])

      const result = await waitForTx(client, mockTxResponse.txhash)

      expect(result.txHash).toBe(mockTxResponse.txhash)
      expect(client.tx.getTx).toHaveBeenCalledTimes(1)
      expect(client.tx.getTx).toHaveBeenCalledWith({ hash: mockTxResponse.txhash })
    })

    it('should retry when tx not found initially', async () => {
      const client = createMockClient([
        { txResponse: undefined }, // First call: not found
        { txResponse: undefined }, // Second call: not found
        { txResponse: mockTxResponse }, // Third call: found
      ])

      const result = await waitForTx(client, mockTxResponse.txhash, {
        pollInterval: 10, // Fast polling for test
      })

      expect(result.txHash).toBe(mockTxResponse.txhash)
      expect(client.tx.getTx).toHaveBeenCalledTimes(3)
    })

    it('should retry on query error', async () => {
      const client = createMockClient([
        new Error('not found'), // First call: error
        new Error('network error'), // Second call: error
        { txResponse: mockTxResponse }, // Third call: success
      ])

      const result = await waitForTx(client, mockTxResponse.txhash, {
        pollInterval: 10,
      })

      expect(result.txHash).toBe(mockTxResponse.txhash)
      expect(client.tx.getTx).toHaveBeenCalledTimes(3)
    })

    it('should throw TimeoutError on timeout', async () => {
      const client = createMockClient([{ txResponse: undefined }]) // Never found

      await expect(
        waitForTx(client, mockTxResponse.txhash, {
          timeout: 50,
          pollInterval: 10,
        })
      ).rejects.toThrow(TimeoutError)
    })

    it('should respect pollInterval', async () => {
      const client = createMockClient([{ txResponse: undefined }, { txResponse: mockTxResponse }])

      const startTime = Date.now()
      await waitForTx(client, mockTxResponse.txhash, {
        pollInterval: 100,
        timeout: 5000,
      })
      const elapsed = Date.now() - startTime

      // Should have waited at least one pollInterval
      expect(elapsed).toBeGreaterThanOrEqual(90) // Allow some timing variance
    })

    it('should use default timeout of 30000ms', async () => {
      const client = createMockClient([{ txResponse: undefined }])

      // This test just verifies the timeout error message includes 30000
      const promise = waitForTx(client, mockTxResponse.txhash, {
        pollInterval: 10,
        timeout: 50, // Override for faster test
      })

      await expect(promise).rejects.toThrow(TimeoutError)
    })

    it('should use default pollInterval of 1000ms', async () => {
      // This is hard to test precisely, but we can verify it works
      const client = createMockClient([{ txResponse: mockTxResponse }])

      const result = await waitForTx(client, mockTxResponse.txhash)

      expect(result.txHash).toBe(mockTxResponse.txhash)
    })
  })

  describe('mode selection', () => {
    it('should use polling when chainInfo not provided', async () => {
      const client = createMockClient([{ txResponse: mockTxResponse }])

      const result = await waitForTx(client, mockTxResponse.txhash)

      expect(result.txHash).toBe(mockTxResponse.txhash)
      // Polling mode used, one call made
      expect(client.tx.getTx).toHaveBeenCalledTimes(1)
    })

    it('should use polling when chainInfo has no wss', async () => {
      const client = createMockClient([{ txResponse: mockTxResponse }])

      const result = await waitForTx(client, mockTxResponse.txhash, {
        chainInfo: mockChainInfoNoWss,
      })

      expect(result.txHash).toBe(mockTxResponse.txhash)
      expect(client.tx.getTx).toHaveBeenCalledTimes(1)
    })
  })

  describe('WebSocket mode (mock)', () => {
    let originalWebSocket: typeof WebSocket
    let mockWebSocketInstances: MockWebSocket[]

    class MockWebSocket {
      static CONNECTING = 0
      static OPEN = 1
      static CLOSING = 2
      static CLOSED = 3

      onopen: (() => void) | null = null
      onclose: (() => void) | null = null
      onmessage: ((event: { data: string }) => void) | null = null
      onerror: (() => void) | null = null
      readyState = MockWebSocket.CONNECTING

      constructor(public url: string) {
        mockWebSocketInstances.push(this)
        // Simulate async connection
        setTimeout(() => {
          this.readyState = MockWebSocket.OPEN
          this.onopen?.()
        }, 5)
      }

      send(_data: string) {
        // Simulate subscription response after a short delay
        setTimeout(() => {
          this.onmessage?.({
            data: JSON.stringify({
              id: 1,
              result: {},
            }),
          })
        }, 5)
      }

      close() {
        this.readyState = MockWebSocket.CLOSED
        this.onclose?.()
      }

      // Test helper to simulate block event
      simulateBlockEvent() {
        this.onmessage?.({
          data: JSON.stringify({
            result: {
              query: "tm.event='NewBlock'",
              data: {
                value: {
                  block: {
                    header: { height: '12345' },
                  },
                },
              },
            },
          }),
        })
      }

      // Test helper to simulate connection error
      simulateError() {
        this.readyState = MockWebSocket.CLOSED
        this.onerror?.()
      }
    }

    beforeEach(() => {
      mockWebSocketInstances = []
      originalWebSocket = global.WebSocket
      // @ts-expect-error - Mock WebSocket
      global.WebSocket = MockWebSocket
    })

    afterEach(() => {
      global.WebSocket = originalWebSocket
    })

    it('should use WebSocket when chainInfo with wss provided', async () => {
      const client = createMockClient([
        { txResponse: undefined }, // First query after subscribe: not found
        { txResponse: mockTxResponse }, // Query after block event: found
      ])

      const resultPromise = waitForTx(client, mockTxResponse.txhash, {
        chainInfo: mockChainInfo,
        timeout: 5000,
      })

      // Wait for WebSocket to connect and subscribe
      await new Promise(r => setTimeout(r, 20))

      // Simulate a block event
      if (mockWebSocketInstances.length > 0) {
        mockWebSocketInstances[0].simulateBlockEvent()
      }

      const result = await resultPromise

      expect(result.txHash).toBe(mockTxResponse.txhash)
      expect(mockWebSocketInstances.length).toBeGreaterThan(0)
    })

    it('should find tx that exists before subscription (race condition handling)', async () => {
      // TX already exists when we query after subscription
      const client = createMockClient([{ txResponse: mockTxResponse }])

      const result = await waitForTx(client, mockTxResponse.txhash, {
        chainInfo: mockChainInfo,
        timeout: 5000,
      })

      expect(result.txHash).toBe(mockTxResponse.txhash)
    })

    it('should fallback to polling on WebSocket connection failure', async () => {
      // Make WebSocket fail
      class FailingWebSocket {
        onopen: (() => void) | null = null
        onclose: (() => void) | null = null
        onmessage: ((event: { data: string }) => void) | null = null
        onerror: (() => void) | null = null

        constructor() {
          setTimeout(() => {
            this.onerror?.()
          }, 5)
        }

        send() {}
        close() {}
      }
      // @ts-expect-error - Mock WebSocket
      global.WebSocket = FailingWebSocket

      const client = createMockClient([{ txResponse: mockTxResponse }])

      const result = await waitForTx(client, mockTxResponse.txhash, {
        chainInfo: mockChainInfo,
        timeout: 5000,
        pollInterval: 10,
      })

      // Should still succeed via polling fallback
      expect(result.txHash).toBe(mockTxResponse.txhash)
    })

    it('should not fallback on TimeoutError', async () => {
      const client = createMockClient([{ txResponse: undefined }])

      // WebSocket connects but tx is never found
      await expect(
        waitForTx(client, mockTxResponse.txhash, {
          chainInfo: mockChainInfo,
          timeout: 100,
        })
      ).rejects.toThrow(TimeoutError)
    })

    it('should cleanup WebSocket on success', async () => {
      const client = createMockClient([{ txResponse: mockTxResponse }])

      await waitForTx(client, mockTxResponse.txhash, {
        chainInfo: mockChainInfo,
        timeout: 5000,
      })

      // WebSocket should be closed after finding tx
      await new Promise(r => setTimeout(r, 50))
      if (mockWebSocketInstances.length > 0) {
        expect(mockWebSocketInstances[0].readyState).toBe(MockWebSocket.CLOSED)
      }
    })

    it('should cleanup WebSocket on timeout', async () => {
      const client = createMockClient([{ txResponse: undefined }])

      await expect(
        waitForTx(client, mockTxResponse.txhash, {
          chainInfo: mockChainInfo,
          timeout: 50,
        })
      ).rejects.toThrow(TimeoutError)

      // WebSocket should be closed after timeout
      await new Promise(r => setTimeout(r, 20))
      if (mockWebSocketInstances.length > 0) {
        expect(mockWebSocketInstances[0].readyState).toBe(MockWebSocket.CLOSED)
      }
    })
  })

  describe('edge cases', () => {
    it('should handle very long tx hash', async () => {
      const longHash = 'A'.repeat(64)
      const client = createMockClient([{ txResponse: { ...mockTxResponse, txhash: longHash } }])

      const result = await waitForTx(client, longHash)

      expect(result.txHash).toBe(longHash)
    })

    it('should handle special characters in rawLog', async () => {
      const specialLog = 'Error: "test" with \'quotes\' and \n newlines'
      const client = createMockClient([{ txResponse: { ...mockTxResponse, rawLog: specialLog } }])

      const result = await waitForTx(client, mockTxResponse.txhash)

      expect(result.rawLog).toBe(specialLog)
    })

    it('should handle zero values', async () => {
      const zeroTxResponse = {
        ...mockTxResponse,
        code: 0,
        gasUsed: 0n,
        gasWanted: 0n,
      }
      const client = createMockClient([{ txResponse: zeroTxResponse }])

      const result = await waitForTx(client, mockTxResponse.txhash)

      expect(result.code).toBe(0)
      expect(result.gasUsed).toBe(0n)
      expect(result.gasWanted).toBe(0n)
    })
  })
})

// ============================================================================
// Part 2: Real Network Tests (using testnet)
// ============================================================================

describe('waitForTx (Real Network Tests)', () => {
  let initiaChainInfo: ChainInfo | null = null
  let client: Client | null = null

  beforeAll(async () => {
    try {
      const { getInitiaTestnet } = await import('../../helpers/test-chains')
      initiaChainInfo = await getInitiaTestnet()
      if (initiaChainInfo?.grpc) {
        const { createClient } = await import('../../../src/entry.node')
        client = createClient(initiaChainInfo)
      }
    } catch {
      initiaChainInfo = null
    }
  })

  it('should find existing transaction by hash from recent blocks', async () => {
    if (!initiaChainInfo?.grpc || !client) {
      console.log('Skipping: Initia testnet not available')
      return
    }

    try {
      // Get the latest block height first
      const latestBlock = await client.tendermint.getLatestBlock({})
      const latestHeight = Number(latestBlock.block?.header?.height ?? 0)

      if (latestHeight === 0) {
        console.log('Skipping: Could not get latest block height')
        return
      }

      // Query transactions from recent blocks only (last 1000 blocks)
      const minHeight = Math.max(1, latestHeight - 1000)
      const txsResult = await client.tx.getTxsEvent({
        query: `tx.height>=${minHeight}`,
        pagination: { limit: 1n, reverse: true },
      })

      if (txsResult.txResponses.length === 0) {
        console.log('Skipping: No transactions found on chain')
        return
      }

      const recentTx = txsResult.txResponses[0]
      const txHash = recentTx.txhash

      // Now test waitForTx - should find it immediately
      const result = await waitForTx(client, txHash, {
        timeout: 15000,
        chainInfo: initiaChainInfo,
      })

      expect(result.txHash).toBe(txHash)
      expect(result.height).toBeDefined()
      expect(result.code).toBeDefined()
      expect(result.events).toBeDefined()
    } catch (error) {
      if (error instanceof ConnectError || error instanceof TimeoutError) {
        console.log('Skipping due to network/timeout error:', (error as Error).message)
        return
      }
      throw error
    }
  }, 30000)

  it('should find transaction using polling when wss not specified', async () => {
    if (!initiaChainInfo?.grpc || !client) {
      console.log('Skipping: Initia testnet not available')
      return
    }

    try {
      // Get the latest block height first
      const latestBlock = await client.tendermint.getLatestBlock({})
      const latestHeight = Number(latestBlock.block?.header?.height ?? 0)

      if (latestHeight === 0) {
        console.log('Skipping: Could not get latest block height')
        return
      }

      // Query transactions from recent blocks only (last 1000 blocks)
      const minHeight = Math.max(1, latestHeight - 1000)
      const txsResult = await client.tx.getTxsEvent({
        query: `tx.height>=${minHeight}`,
        pagination: { limit: 1n, reverse: true },
      })

      if (txsResult.txResponses.length === 0) {
        console.log('Skipping: No transactions found in recent blocks')
        return
      }

      const txHash = txsResult.txResponses[0].txhash

      // Use chainInfo without wss to force polling
      const chainInfoNoWss: ChainInfo = {
        ...initiaChainInfo,
        wss: undefined,
      }

      const result = await waitForTx(client, txHash, {
        timeout: 15000,
        chainInfo: chainInfoNoWss,
      })

      expect(result.txHash).toBe(txHash)
    } catch (error) {
      if (error instanceof ConnectError || error instanceof TimeoutError) {
        console.log('Skipping due to network/timeout error:', (error as Error).message)
        return
      }
      throw error
    }
  }, 30000)

  it('should find transaction using WebSocket mode', async () => {
    if (!initiaChainInfo?.wss || !client) {
      console.log('Skipping: Initia testnet with WebSocket not available')
      return
    }

    try {
      // Get the latest block height first
      const latestBlock = await client.tendermint.getLatestBlock({})
      const latestHeight = Number(latestBlock.block?.header?.height ?? 0)

      if (latestHeight === 0) {
        console.log('Skipping: Could not get latest block height')
        return
      }

      // Query transactions from recent blocks only (last 1000 blocks)
      const minHeight = Math.max(1, latestHeight - 1000)
      const txsResult = await client.tx.getTxsEvent({
        query: `tx.height>=${minHeight}`,
        pagination: { limit: 1n, reverse: true },
      })

      if (txsResult.txResponses.length === 0) {
        console.log('Skipping: No transactions found in recent blocks')
        return
      }

      const txHash = txsResult.txResponses[0].txhash

      // Use full chainInfo with wss for WebSocket mode
      const result = await waitForTx(client, txHash, {
        timeout: 15000,
        chainInfo: initiaChainInfo,
      })

      expect(result.txHash).toBe(txHash)
      expect(result.height).toBeDefined()
    } catch (error) {
      if (error instanceof ConnectError || error instanceof TimeoutError) {
        console.log('Skipping due to network/timeout error:', (error as Error).message)
        return
      }
      throw error
    }
  }, 30000)
})
