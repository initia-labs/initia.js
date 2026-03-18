/**
 * Unit tests for Bridge class.
 */

import { describe, it, expect } from 'vitest'
import { Bridge } from '../../../src/bridge/bridge'
import { Message } from '../../../src/msgs/types'
import { coin } from '../../../src/core/coin'
import type { ChainInfo, ChainInfoProvider } from '../../../src/provider/types'

/** Minimal mock provider for testing. */
function createMockProvider(chains: ChainInfo[]): ChainInfoProvider {
  const map = new Map(chains.map(c => [c.chainId, c]))
  return {
    getChainInfo: (id: string) => map.get(id) as any,
    listChains: () => chains,
    hasChain: (id: string) => map.has(id),
  }
}

const l2Chain: ChainInfo = {
  chainId: 'minimove-1',
  chainName: 'Minimove Testnet',
  chainType: 'minimove',
  network: 'testnet',
  opBridgeId: 3n,
}

const l1Chain: ChainInfo = {
  chainId: 'initiation-2',
  chainName: 'Initia Testnet',
  chainType: 'initia',
  network: 'testnet',
}

const mockCreateTransport = (() => ({})) as any

describe('Bridge', () => {
  const provider = createMockProvider([l1Chain, l2Chain])
  const bridge = new Bridge(provider, mockCreateTransport)

  describe('getBridgeId', () => {
    it('should return opBridgeId for L2 chain', () => {
      expect(bridge.getBridgeId('minimove-1')).toBe(3n)
    })

    it('should throw for unknown chain', () => {
      expect(() => bridge.getBridgeId('unknown-chain')).toThrow('Chain not found: unknown-chain')
    })

    it('should throw for chain without opBridgeId', () => {
      expect(() => bridge.getBridgeId('initiation-2')).toThrow('does not have an opBridgeId')
    })
  })

  describe('listBridgeableChains', () => {
    it('should return only chains with opBridgeId', () => {
      const result = bridge.listBridgeableChains()
      expect(result).toHaveLength(1)
      expect(result[0].chainId).toBe('minimove-1')
    })
  })

  describe('deposit', () => {
    it('should create deposit msg with toChain (bridgeId auto-resolve)', () => {
      const msg = bridge.deposit({
        sender: 'init1sender',
        toChain: 'minimove-1',
        amount: coin('uinit', '1000000'),
      })

      expect(msg).toBeInstanceOf(Message)
      expect(msg.toAny().typeUrl).toBe(`/opinit.ophost.v1.MsgInitiateTokenDeposit`)
      expect(msg.toAny().value).toBeInstanceOf(Uint8Array)
    })

    it('should create deposit msg with bridgeId directly', () => {
      const msg = bridge.deposit({
        sender: 'init1sender',
        bridgeId: 3n,
        to: 'init1receiver',
        amount: coin('uinit', '1000000'),
      })

      expect(msg).toBeInstanceOf(Message)
      expect(msg.toAny().typeUrl).toBe(`/opinit.ophost.v1.MsgInitiateTokenDeposit`)
    })

    it('should accept string amount and produce valid msg', () => {
      // String amount goes through parseCoin → must produce identical encoding
      const fromString = bridge.deposit({
        sender: 'init1sender',
        bridgeId: 3n,
        to: 'init1receiver',
        amount: '1000000uinit',
      })
      const fromCoin = bridge.deposit({
        sender: 'init1sender',
        bridgeId: 3n,
        to: 'init1receiver',
        amount: coin('uinit', '1000000'),
      })

      expect(fromString.toAny().typeUrl).toBe(fromCoin.toAny().typeUrl)
      expect(fromString.toAny().value).toEqual(fromCoin.toAny().value)
    })
  })

  describe('withdraw', () => {
    it('should create withdrawal msg', () => {
      const msg = bridge.withdraw({
        sender: 'init1sender',
        to: 'init1receiver',
        amount: coin('l2/uinit', '1000000'),
      })

      expect(msg).toBeInstanceOf(Message)
      expect(msg.toAny().typeUrl).toBe(`/opinit.opchild.v1.MsgInitiateTokenWithdrawal`)
    })
  })

  describe('claim', () => {
    it('should create claim msg for claimable withdrawal', () => {
      const msg = bridge.claim({
        sender: 'init1recipient',
        withdrawal: {
          sequence: 42n,
          from: 'init1l2sender',
          to: 'init1recipient',
          amount: coin('uinit', '1000000'),
          outputIndex: 5n,
          bridgeId: 3n,
          txHash: 'abcdef',
          status: { status: 'claimable' },
          withdrawalProofs: ['aabb', 'ccdd'],
          version: '01',
          storageRoot: 'ff00',
          lastBlockHash: '1234',
        },
      })

      expect(msg).toBeInstanceOf(Message)
      expect(msg.toAny().typeUrl).toBe(`/opinit.ophost.v1.MsgFinalizeTokenWithdrawal`)
    })

    it('should throw for non-claimable withdrawal', () => {
      expect(() =>
        bridge.claim({
          sender: 'init1recipient',
          withdrawal: {
            sequence: 42n,
            from: 'init1l2sender',
            to: 'init1recipient',
            amount: coin('uinit', '1000000'),
            outputIndex: 5n,
            bridgeId: 3n,
            txHash: 'abcdef',
            status: { status: 'pending' },
            withdrawalProofs: [],
            version: '',
            storageRoot: '',
            lastBlockHash: '',
          },
        })
      ).toThrow('Withdrawal is not claimable (current status: pending)')
    })
  })
})
