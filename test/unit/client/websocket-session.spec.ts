/**
 * Unit tests for WebSocketSession management.
 *
 * Split into two parts:
 * 1. Mock tests - For lazy connection, error handling (require mocks)
 * 2. Real network tests - For actual subscriptions using testnet
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import {
  createSession,
  WebSocketSession,
  WebSocketNotAvailableError,
  type SessionOptions,
} from '../../../src/client/websocket'
import type { ChainInfo } from '../../../src/provider/types'
import { getInitiaTestnet, getEvmTestnet } from '../../helpers/test-chains'

const RUN_REAL_WEBSOCKET_TESTS = process.env.TEST_REAL_WEBSOCKET === 'true'

// ============================================================================
// Mock ChainInfo for mock tests
// ============================================================================

const createMockChainInfo = (options: { wss?: string; evmWss?: string }): ChainInfo => ({
  chainId: 'test-chain',
  chainName: 'Test Chain',
  chainType: 'minievm',
  network: 'testnet',
  rest: 'https://rest.test.com',
  grpc: 'https://grpc.test.com',
  wss: options.wss,
  evmWss: options.evmWss,
})

// ============================================================================
// Mock WebSocket class for mock tests
// ============================================================================

class MockWebSocket {
  static instances: MockWebSocket[] = []
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onerror: (() => void) | null = null
  readyState = MockWebSocket.CONNECTING
  sentMessages: string[] = []

  constructor(public url: string) {
    MockWebSocket.instances.push(this)
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      this.onopen?.()
    }, 5)
  }

  send(data: string) {
    this.sentMessages.push(data)
    const parsed = JSON.parse(data)
    setTimeout(() => {
      if (parsed.method === 'subscribe') {
        this.onmessage?.({
          data: JSON.stringify({
            id: parsed.id,
            result: {},
          }),
        })
      } else if (parsed.method === 'eth_subscribe') {
        this.onmessage?.({
          data: JSON.stringify({
            id: parsed.id,
            result: `sub-${parsed.id}`,
          }),
        })
      }
    }, 5)
  }

  close() {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.()
  }

  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) })
  }

  simulateClose() {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.()
  }
}

// ============================================================================
// Part 1: Mock Tests (require mocked WebSocket)
// ============================================================================

describe('WebSocketSession (Mock Tests)', () => {
  let originalWebSocket: typeof WebSocket

  beforeEach(() => {
    MockWebSocket.instances = []
    originalWebSocket = global.WebSocket
    // @ts-expect-error - Mock WebSocket
    global.WebSocket = MockWebSocket
  })

  afterEach(() => {
    global.WebSocket = originalWebSocket
  })

  describe('createSession', () => {
    it('should create session with chainInfo', () => {
      const chainInfo = createMockChainInfo({ wss: 'wss://ws.test.com' })
      const session = createSession(chainInfo)
      expect(session).toBeInstanceOf(WebSocketSession)
    })

    it('should accept SessionOptions', () => {
      const chainInfo = createMockChainInfo({ wss: 'wss://ws.test.com' })
      const options: SessionOptions = {
        autoReconnect: false,
        maxRetries: 5,
        retryDelay: 2000,
        maxRetryDelay: 60000,
        onConnectionEvent: vi.fn(),
      }
      const session = createSession(chainInfo, options)
      expect(session).toBeInstanceOf(WebSocketSession)
    })

    it('should not connect immediately (lazy connection)', () => {
      const chainInfo = createMockChainInfo({ wss: 'wss://ws.test.com' })
      createSession(chainInfo)
      // No WebSocket should be created yet
      expect(MockWebSocket.instances).toHaveLength(0)
    })
  })

  describe('endpoint availability', () => {
    it('should report hasCosmosEndpoint correctly', () => {
      const chainInfoWithWss = createMockChainInfo({ wss: 'wss://ws.test.com' })
      const chainInfoWithoutWss = createMockChainInfo({})

      const sessionWith = createSession(chainInfoWithWss)
      const sessionWithout = createSession(chainInfoWithoutWss)

      expect(sessionWith.hasCosmosEndpoint).toBe(true)
      expect(sessionWithout.hasCosmosEndpoint).toBe(false)
    })

    it('should report hasEvmEndpoint correctly', () => {
      const chainInfoWithEvmWss = createMockChainInfo({ evmWss: 'wss://evm-ws.test.com' })
      const chainInfoWithoutEvmWss = createMockChainInfo({})

      const sessionWith = createSession(chainInfoWithEvmWss)
      const sessionWithout = createSession(chainInfoWithoutEvmWss)

      expect(sessionWith.hasEvmEndpoint).toBe(true)
      expect(sessionWithout.hasEvmEndpoint).toBe(false)
    })
  })

  describe('subscribe error handling', () => {
    it('should throw WebSocketNotAvailableError if wss not available', async () => {
      const chainInfo = createMockChainInfo({}) // No wss
      const session = createSession(chainInfo)

      await expect(session.subscribe({ event: 'block' }, () => {})).rejects.toThrow(
        WebSocketNotAvailableError
      )
    })

    it('should throw WebSocketNotAvailableError if evmWss not available', async () => {
      const chainInfo = createMockChainInfo({ wss: 'wss://ws.test.com' }) // No evmWss
      const session = createSession(chainInfo)

      await expect(session.subscribe({ event: 'evmLogs' }, () => {})).rejects.toThrow(
        WebSocketNotAvailableError
      )
    })
  })

  describe('cosmos subscription routing (mock)', () => {
    it('should route block event correctly', async () => {
      const chainInfo = createMockChainInfo({ wss: 'wss://ws.test.com' })
      const session = createSession(chainInfo)

      await session.subscribe({ event: 'block' }, () => {})

      const ws = MockWebSocket.instances[0]
      expect(ws.sentMessages).toHaveLength(1)
      const msg = JSON.parse(ws.sentMessages[0])
      expect(msg.method).toBe('subscribe')
      expect(msg.params[0]).toBe("tm.event='NewBlock'")
    })

    it('should route tx event with filter correctly', async () => {
      const chainInfo = createMockChainInfo({ wss: 'wss://ws.test.com' })
      const session = createSession(chainInfo)

      await session.subscribe({ event: 'tx', filter: "transfer.recipient='init1abc'" }, () => {})

      const ws = MockWebSocket.instances[0]
      const msg = JSON.parse(ws.sentMessages[0])
      expect(msg.params[0]).toBe("tm.event='Tx' AND transfer.recipient='init1abc'")
    })

    it('should reuse same WebSocket for multiple cosmos subscriptions', async () => {
      const chainInfo = createMockChainInfo({ wss: 'wss://ws.test.com' })
      const session = createSession(chainInfo)

      await session.subscribe({ event: 'block' }, () => {})
      await session.subscribe({ event: 'tx' }, () => {})

      expect(MockWebSocket.instances).toHaveLength(1)
    })
  })

  describe('evm subscription routing (mock)', () => {
    it('should route evmLogs event correctly', async () => {
      const chainInfo = createMockChainInfo({ evmWss: 'wss://evm-ws.test.com' })
      const session = createSession(chainInfo)

      await session.subscribe({ event: 'evmLogs', filter: { address: '0x1234' } }, () => {})

      const ws = MockWebSocket.instances[0]
      expect(ws.sentMessages).toHaveLength(1)
      const msg = JSON.parse(ws.sentMessages[0])
      expect(msg.method).toBe('eth_subscribe')
      expect(msg.params[0]).toBe('logs')
      expect(msg.params[1]).toEqual({ address: '0x1234' })
    })

    it('should route evmHeads event correctly', async () => {
      const chainInfo = createMockChainInfo({ evmWss: 'wss://evm-ws.test.com' })
      const session = createSession(chainInfo)

      await session.subscribe({ event: 'evmHeads' }, () => {})

      const ws = MockWebSocket.instances[0]
      const msg = JSON.parse(ws.sentMessages[0])
      expect(msg.method).toBe('eth_subscribe')
      expect(msg.params[0]).toBe('newHeads')
    })
  })

  describe('mixed subscriptions (mock)', () => {
    it('should create separate WebSockets for cosmos and evm', async () => {
      const chainInfo = createMockChainInfo({
        wss: 'wss://ws.test.com',
        evmWss: 'wss://evm-ws.test.com',
      })
      const session = createSession(chainInfo)

      await session.subscribe({ event: 'block' }, () => {})
      await session.subscribe({ event: 'evmHeads' }, () => {})

      expect(MockWebSocket.instances).toHaveLength(2)
      expect(MockWebSocket.instances[0].url).toBe('wss://ws.test.com')
      expect(MockWebSocket.instances[1].url).toBe('wss://evm-ws.test.com')
    })
  })

  describe('connection state (mock)', () => {
    it('should track cosmosConnected', async () => {
      const chainInfo = createMockChainInfo({ wss: 'wss://ws.test.com' })
      const session = createSession(chainInfo)

      expect(session.cosmosConnected).toBe(false)
      await session.subscribe({ event: 'block' }, () => {})
      expect(session.cosmosConnected).toBe(true)
    })

    it('should track evmConnected', async () => {
      const chainInfo = createMockChainInfo({ evmWss: 'wss://evm-ws.test.com' })
      const session = createSession(chainInfo)

      expect(session.evmConnected).toBe(false)
      await session.subscribe({ event: 'evmHeads' }, () => {})
      expect(session.evmConnected).toBe(true)
    })

    it('should track subscriptionCount', async () => {
      const chainInfo = createMockChainInfo({
        wss: 'wss://ws.test.com',
        evmWss: 'wss://evm-ws.test.com',
      })
      const session = createSession(chainInfo)

      expect(session.subscriptionCount).toBe(0)
      await session.subscribe({ event: 'block' }, () => {})
      expect(session.subscriptionCount).toBe(1)
      await session.subscribe({ event: 'evmHeads' }, () => {})
      expect(session.subscriptionCount).toBe(2)
    })
  })

  describe('callback handling (mock)', () => {
    it('should call callback when event received', async () => {
      const chainInfo = createMockChainInfo({ wss: 'wss://ws.test.com' })
      const session = createSession(chainInfo)
      const callback = vi.fn()

      await session.subscribe({ event: 'block' }, callback)

      // Simulate block event
      const ws = MockWebSocket.instances[0]
      ws.simulateMessage({
        result: {
          query: "tm.event='NewBlock'",
          data: {
            value: {
              block: { header: { height: '12345' } },
            },
          },
        },
      })

      // Wait for event processing
      await new Promise(r => setTimeout(r, 10))

      expect(callback).toHaveBeenCalled()
      const eventData = callback.mock.calls[0][0]
      // After dataExtractor, block event returns just the block content
      expect(eventData.header.height).toBe('12345')
    })
  })

  describe('unsubscribe (mock)', () => {
    it('should send unsubscribe message for cosmos', async () => {
      const chainInfo = createMockChainInfo({ wss: 'wss://ws.test.com' })
      const session = createSession(chainInfo)

      const sub = await session.subscribe({ event: 'block' }, () => {})
      sub.unsubscribe()

      const ws = MockWebSocket.instances[0]
      expect(ws.sentMessages).toHaveLength(2)
      const unsubMsg = JSON.parse(ws.sentMessages[1])
      expect(unsubMsg.method).toBe('unsubscribe')
    })

    it('should send eth_unsubscribe message for evm', async () => {
      const chainInfo = createMockChainInfo({ evmWss: 'wss://evm-ws.test.com' })
      const session = createSession(chainInfo)

      const sub = await session.subscribe({ event: 'evmHeads' }, () => {})
      sub.unsubscribe()

      const ws = MockWebSocket.instances[0]
      expect(ws.sentMessages).toHaveLength(2)
      const unsubMsg = JSON.parse(ws.sentMessages[1])
      expect(unsubMsg.method).toBe('eth_unsubscribe')
    })

    it('should decrease subscriptionCount after unsubscribe', async () => {
      const chainInfo = createMockChainInfo({ wss: 'wss://ws.test.com' })
      const session = createSession(chainInfo)

      const sub = await session.subscribe({ event: 'block' }, () => {})
      expect(session.subscriptionCount).toBe(1)

      sub.unsubscribe()
      expect(session.subscriptionCount).toBe(0)
    })
  })

  describe('close (mock)', () => {
    it('should close all WebSocket connections', async () => {
      const chainInfo = createMockChainInfo({
        wss: 'wss://ws.test.com',
        evmWss: 'wss://evm-ws.test.com',
      })
      const session = createSession(chainInfo)

      await session.subscribe({ event: 'block' }, () => {})
      await session.subscribe({ event: 'evmHeads' }, () => {})

      session.close()

      expect(MockWebSocket.instances[0].readyState).toBe(MockWebSocket.CLOSED)
      expect(MockWebSocket.instances[1].readyState).toBe(MockWebSocket.CLOSED)
    })

    it('should clear all subscriptions', async () => {
      const chainInfo = createMockChainInfo({ wss: 'wss://ws.test.com' })
      const session = createSession(chainInfo)

      await session.subscribe({ event: 'block' }, () => {})
      await session.subscribe({ event: 'tx' }, () => {})

      session.close()

      expect(session.subscriptionCount).toBe(0)
    })

    it('should reset connection state', async () => {
      const chainInfo = createMockChainInfo({ wss: 'wss://ws.test.com' })
      const session = createSession(chainInfo)

      await session.subscribe({ event: 'block' }, () => {})
      expect(session.cosmosConnected).toBe(true)

      session.close()

      expect(session.cosmosConnected).toBe(false)
    })
  })
})

// ============================================================================
// Part 2: Real Network Tests (using testnet)
// ============================================================================

describe.skipIf(!RUN_REAL_WEBSOCKET_TESTS)('WebSocketSession (Real Network Tests)', () => {
  let initiaChainInfo: ChainInfo | null = null
  let evmChainInfo: ChainInfo | null = null

  beforeAll(async () => {
    initiaChainInfo = await getInitiaTestnet()
    evmChainInfo = await getEvmTestnet()
  })

  describe('Initia testnet subscription', () => {
    it('should subscribe to blocks and receive events', async () => {
      if (!initiaChainInfo?.wss) {
        console.log('Skipping: Initia testnet with WebSocket not available')
        return
      }

      const session = createSession(initiaChainInfo)
      const blocks: unknown[] = []

      const sub = await session.subscribe({ event: 'block' }, block => {
        blocks.push(block)
      })

      expect(sub.id).toBeDefined()
      expect(session.cosmosConnected).toBe(true)

      // Wait for at least one block (max 30 seconds)
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          sub.unsubscribe()
          session.close()
          reject(new Error('Timeout waiting for block'))
        }, 30000)

        const checkInterval = setInterval(() => {
          if (blocks.length > 0) {
            clearTimeout(timeout)
            clearInterval(checkInterval)
            resolve()
          }
        }, 100)
      })

      expect(blocks.length).toBeGreaterThan(0)

      // Verify block structure (dataExtractor returns value.block directly)
      const block = blocks[0] as { header?: { height?: string } }
      expect(block.header?.height).toBeDefined()

      sub.unsubscribe()
      session.close()
    }, 35000)

    it('should handle multiple subscriptions on same session', async () => {
      if (!initiaChainInfo?.wss) {
        console.log('Skipping: Initia testnet with WebSocket not available')
        return
      }

      const session = createSession(initiaChainInfo)
      const blocks: unknown[] = []
      const headers: unknown[] = []

      const sub1 = await session.subscribe({ event: 'block' }, block => {
        blocks.push(block)
      })

      const sub2 = await session.subscribe({ event: 'blockHeader' }, header => {
        headers.push(header)
      })

      expect(session.subscriptionCount).toBe(2)

      // Wait for both to receive data
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          sub1.unsubscribe()
          sub2.unsubscribe()
          session.close()
          reject(new Error('Timeout waiting for events'))
        }, 30000)

        const checkInterval = setInterval(() => {
          if (blocks.length > 0 || headers.length > 0) {
            clearTimeout(timeout)
            clearInterval(checkInterval)
            resolve()
          }
        }, 100)
      })

      // At least one should have received data
      expect(blocks.length + headers.length).toBeGreaterThan(0)

      sub1.unsubscribe()
      sub2.unsubscribe()
      session.close()
    }, 35000)

    it('should properly close session and cleanup', async () => {
      if (!initiaChainInfo?.wss) {
        console.log('Skipping: Initia testnet with WebSocket not available')
        return
      }

      const session = createSession(initiaChainInfo)

      await session.subscribe({ event: 'block' }, () => {})
      expect(session.cosmosConnected).toBe(true)
      expect(session.subscriptionCount).toBe(1)

      session.close()

      expect(session.cosmosConnected).toBe(false)
      expect(session.subscriptionCount).toBe(0)
    })
  })

  describe('EVM testnet subscription', () => {
    it('should subscribe to EVM new heads', async () => {
      if (!evmChainInfo?.evmWss) {
        console.log('Skipping: EVM testnet with WebSocket not available')
        return
      }

      const session = createSession(evmChainInfo)
      const heads: unknown[] = []

      const sub = await session.subscribe({ event: 'evmHeads' }, head => {
        heads.push(head)
      })

      expect(sub.id).toBeDefined()
      expect(session.evmConnected).toBe(true)

      // Wait for at least one head (max 30 seconds)
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          sub.unsubscribe()
          session.close()
          reject(new Error('Timeout waiting for EVM head'))
        }, 30000)

        const checkInterval = setInterval(() => {
          if (heads.length > 0) {
            clearTimeout(timeout)
            clearInterval(checkInterval)
            resolve()
          }
        }, 100)
      })

      expect(heads.length).toBeGreaterThan(0)

      // Verify EVM block header structure
      const head = heads[0] as { number?: string; hash?: string }
      expect(head.number || head.hash).toBeDefined()

      sub.unsubscribe()
      session.close()
    }, 35000)

    it('should subscribe to EVM logs', async () => {
      if (!evmChainInfo?.evmWss) {
        console.log('Skipping: EVM testnet with WebSocket not available')
        return
      }

      const session = createSession(evmChainInfo)

      // Subscribe to all logs (no filter)
      const sub = await session.subscribe({ event: 'evmLogs' }, () => {})

      expect(sub.id).toBeDefined()
      expect(session.evmConnected).toBe(true)

      // Just verify subscription works
      sub.unsubscribe()
      session.close()
    })
  })
})
