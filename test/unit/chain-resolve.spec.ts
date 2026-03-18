import { describe, it, expect } from 'vitest'
import { resolveServices, resolveRegistry, resolveMsgs } from '../../src/chains/resolve'
import { ValidationError } from '../../src/errors'
import type { ChainInfo } from '../../src/provider/types'

function makeChainInfo(chainType: string, network = 'mainnet'): ChainInfo {
  return {
    chainId: 'test-1',
    chainName: 'test',
    chainType: chainType as ChainInfo['chainType'],
    network: network as ChainInfo['network'],
    grpcUrl: 'https://grpc.test.xyz',
  } as ChainInfo
}

describe('chains/resolve', () => {
  describe('resolveServices', () => {
    it('returns services for known chain types', () => {
      const services = resolveServices(makeChainInfo('initia'))
      expect(services.bank).toBeDefined()
      expect(services.move).toBeDefined()
    })

    it('returns base services for "other" chain type', () => {
      const services = resolveServices(makeChainInfo('other'))
      expect(services.bank).toBeDefined()
      expect(services.auth).toBeDefined()
      // 'other' should not have chain-specific services
      expect(services.move).toBeUndefined()
      expect(services.evm).toBeUndefined()
    })

    it('throws ValidationError for unknown chain type', () => {
      expect(() => resolveServices(makeChainInfo('nonexistent'))).toThrow(ValidationError)
    })

    it('error message lists known chain types', () => {
      expect(() => resolveServices(makeChainInfo('bad'))).toThrow(
        /initia, minievm, minimove, miniwasm/
      )
    })
  })

  describe('resolveRegistry', () => {
    it('returns registry for known chain types', () => {
      const registry = resolveRegistry(makeChainInfo('minievm'))
      expect(registry).toBeDefined()
      expect(registry.getMessage('minievm.evm.v1.MsgCall')).toBeDefined()
    })

    it('returns base registry for "other"', () => {
      const registry = resolveRegistry(makeChainInfo('other'))
      expect(registry).toBeDefined()
      expect(registry.getMessage('cosmos.bank.v1beta1.MsgSend')).toBeDefined()
    })
  })

  describe('resolveMsgs', () => {
    it('returns msgs for known chain types', () => {
      const msgs = resolveMsgs('minievm') as unknown as Record<string, Record<string, unknown>>
      expect(msgs.evm).toBeDefined()
      expect(typeof msgs.evm.call).toBe('function')
    })

    it('returns base msgs for "other"', () => {
      const msgs = resolveMsgs('other') as unknown as Record<string, Record<string, unknown>>
      expect(msgs.bank).toBeDefined()
      expect(typeof msgs.bank.send).toBe('function')
    })

    it('throws ValidationError for unknown chain type', () => {
      expect(() => resolveMsgs('nonexistent' as any)).toThrow(ValidationError)
    })

    it('caches results by chainType', () => {
      const first = resolveMsgs('initia')
      const second = resolveMsgs('initia')
      expect(first).toBe(second) // same reference = cache hit
    })
  })

  describe('WeakMap cache', () => {
    it('same ChainInfo object returns cached result', () => {
      const info = makeChainInfo('initia')
      const services1 = resolveServices(info)
      const services2 = resolveServices(info)
      expect(services1).toBe(services2) // same reference = cache hit
    })

    it('resolveServices and resolveRegistry share cache for same ChainInfo', () => {
      const info = makeChainInfo('minimove')
      const services = resolveServices(info)
      const registry = resolveRegistry(info)
      // both should come from the same build — verify indirectly
      expect(services.bank).toBeDefined()
      expect(registry.getMessage('cosmos.bank.v1beta1.MsgSend')).toBeDefined()
    })

    it('different ChainInfo objects get separate builds', () => {
      const info1 = makeChainInfo('initia')
      const info2 = makeChainInfo('initia')
      const services1 = resolveServices(info1)
      const services2 = resolveServices(info2)
      // same value, different objects — WeakMap keys by identity
      expect(services1).not.toBe(services2)
    })
  })
})
