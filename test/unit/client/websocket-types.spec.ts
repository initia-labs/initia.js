/**
 * Unit tests for WebSocket type guards and utilities.
 */

import { describe, it, expect } from 'vitest'
import {
  isCosmosEvent,
  isEvmEvent,
  hasWebSocketEndpoint,
  type EventSpec,
  type CosmosEventSpec,
  type EvmEventSpec,
} from '../../../src/client/websocket'
import type { ChainInfo } from '../../../src/provider/types'

describe('WebSocket Types', () => {
  describe('isCosmosEvent', () => {
    it('should return true for block event', () => {
      const spec: EventSpec = { event: 'block' }
      expect(isCosmosEvent(spec)).toBe(true)
    })

    it('should return true for blockHeader event', () => {
      const spec: EventSpec = { event: 'blockHeader' }
      expect(isCosmosEvent(spec)).toBe(true)
    })

    it('should return true for tx event', () => {
      const spec: EventSpec = { event: 'tx' }
      expect(isCosmosEvent(spec)).toBe(true)
    })

    it('should return true for tx event with filter', () => {
      const spec: EventSpec = { event: 'tx', filter: "transfer.recipient='init1...'" }
      expect(isCosmosEvent(spec)).toBe(true)
    })

    it('should return true for validatorUpdates event', () => {
      const spec: EventSpec = { event: 'validatorUpdates' }
      expect(isCosmosEvent(spec)).toBe(true)
    })

    it('should return true for cosmosCustom event', () => {
      const spec: EventSpec = { event: 'cosmosCustom', query: "tm.event='NewBlock'" }
      expect(isCosmosEvent(spec)).toBe(true)
    })

    it('should return false for evmLogs event', () => {
      const spec: EventSpec = { event: 'evmLogs' }
      expect(isCosmosEvent(spec)).toBe(false)
    })

    it('should return false for evmHeads event', () => {
      const spec: EventSpec = { event: 'evmHeads' }
      expect(isCosmosEvent(spec)).toBe(false)
    })

    it('should narrow type correctly', () => {
      const spec: EventSpec = { event: 'block' }
      if (isCosmosEvent(spec)) {
        // TypeScript should recognize this as CosmosEventSpec
        const _cosmosSpec: CosmosEventSpec = spec
        expect(_cosmosSpec.event).toBe('block')
      }
    })
  })

  describe('isEvmEvent', () => {
    it('should return true for evmLogs event', () => {
      const spec: EventSpec = { event: 'evmLogs' }
      expect(isEvmEvent(spec)).toBe(true)
    })

    it('should return true for evmLogs event with filter', () => {
      const spec: EventSpec = {
        event: 'evmLogs',
        filter: { address: '0x1234', topics: ['0xabcd'] },
      }
      expect(isEvmEvent(spec)).toBe(true)
    })

    it('should return true for evmHeads event', () => {
      const spec: EventSpec = { event: 'evmHeads' }
      expect(isEvmEvent(spec)).toBe(true)
    })

    it('should return true for evmPendingTxs event', () => {
      const spec: EventSpec = { event: 'evmPendingTxs' }
      expect(isEvmEvent(spec)).toBe(true)
    })

    it('should return true for evmSyncing event', () => {
      const spec: EventSpec = { event: 'evmSyncing' }
      expect(isEvmEvent(spec)).toBe(true)
    })

    it('should return true for evmCustom event', () => {
      const spec: EventSpec = { event: 'evmCustom', type: 'logs', params: {} }
      expect(isEvmEvent(spec)).toBe(true)
    })

    it('should return false for block event', () => {
      const spec: EventSpec = { event: 'block' }
      expect(isEvmEvent(spec)).toBe(false)
    })

    it('should return false for tx event', () => {
      const spec: EventSpec = { event: 'tx' }
      expect(isEvmEvent(spec)).toBe(false)
    })

    it('should narrow type correctly', () => {
      const spec: EventSpec = { event: 'evmLogs' }
      if (isEvmEvent(spec)) {
        // TypeScript should recognize this as EvmEventSpec
        const _evmSpec: EvmEventSpec = spec
        expect(_evmSpec.event).toBe('evmLogs')
      }
    })
  })

  describe('hasWebSocketEndpoint', () => {
    const createChainInfo = (wss?: string, evmWss?: string): ChainInfo => ({
      chainId: 'test-chain',
      chainName: 'Test Chain',
      chainType: 'initia',
      network: 'testnet',
      grpc: 'https://grpc.test.com',
      wss,
      evmWss,
    })

    describe('cosmos type (default)', () => {
      it('should return true when wss exists', () => {
        const chainInfo = createChainInfo('wss://ws.test.com')
        expect(hasWebSocketEndpoint(chainInfo)).toBe(true)
      })

      it('should return true when wss exists (explicit cosmos)', () => {
        const chainInfo = createChainInfo('wss://ws.test.com')
        expect(hasWebSocketEndpoint(chainInfo, 'cosmos')).toBe(true)
      })

      it('should return false when wss is undefined', () => {
        const chainInfo = createChainInfo(undefined)
        expect(hasWebSocketEndpoint(chainInfo)).toBe(false)
      })

      it('should return false when wss is empty string', () => {
        const chainInfo = createChainInfo('')
        expect(hasWebSocketEndpoint(chainInfo)).toBe(false)
      })

      it('should ignore evmWss for cosmos type', () => {
        const chainInfo = createChainInfo(undefined, 'wss://evm-ws.test.com')
        expect(hasWebSocketEndpoint(chainInfo, 'cosmos')).toBe(false)
      })
    })

    describe('evm type', () => {
      it('should return true when evmWss exists', () => {
        const chainInfo = createChainInfo(undefined, 'wss://evm-ws.test.com')
        expect(hasWebSocketEndpoint(chainInfo, 'evm')).toBe(true)
      })

      it('should return false when evmWss is undefined', () => {
        const chainInfo = createChainInfo('wss://ws.test.com', undefined)
        expect(hasWebSocketEndpoint(chainInfo, 'evm')).toBe(false)
      })

      it('should return false when evmWss is empty string', () => {
        const chainInfo = createChainInfo('wss://ws.test.com', '')
        expect(hasWebSocketEndpoint(chainInfo, 'evm')).toBe(false)
      })

      it('should ignore wss for evm type', () => {
        const chainInfo = createChainInfo('wss://ws.test.com', undefined)
        expect(hasWebSocketEndpoint(chainInfo, 'evm')).toBe(false)
      })
    })

    describe('both endpoints', () => {
      it('should correctly identify both when present', () => {
        const chainInfo = createChainInfo('wss://ws.test.com', 'wss://evm-ws.test.com')
        expect(hasWebSocketEndpoint(chainInfo, 'cosmos')).toBe(true)
        expect(hasWebSocketEndpoint(chainInfo, 'evm')).toBe(true)
      })
    })
  })
})
