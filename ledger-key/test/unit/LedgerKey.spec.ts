import { describe, it, expect } from 'vitest'
import { LedgerKey, Kind } from '../../src'

// Minimal mock transport with required methods for Eth app
const mockTransport = {
  decorateAppAPIMethods: () => {},
} as any

describe('LedgerKey', () => {
  describe('getPath', () => {
    it('should return Ethereum path', () => {
      const key = new LedgerKey(mockTransport, 0, Kind.Ethereum)
      expect(key.getPath()).toBe("44'/60'/0'/0/0")
    })

    it('should return Cosmos path', () => {
      const key = new LedgerKey(mockTransport, 0, Kind.Cosmos)
      expect(key.getPath()).toBe("m/44'/118'/0'/0/0")
    })

    it('should return path with custom index', () => {
      const key = new LedgerKey(mockTransport, 5, Kind.Ethereum)
      expect(key.getPath()).toBe("44'/60'/0'/0/5")
    })
  })

  describe('accAddress', () => {
    it('should throw error when uninitialized', () => {
      const key = new LedgerKey(mockTransport, 0, Kind.Ethereum)
      expect(() => key.accAddress).toThrow('Ledger is uninitialized')
    })
  })

  describe('createSignature', () => {
    it('should throw error for direct sign mode', async () => {
      const key = new LedgerKey(mockTransport, 0, Kind.Ethereum)
      await expect(key.createSignature({} as any)).rejects.toThrow('direct sign mode is not supported')
    })
  })

})
