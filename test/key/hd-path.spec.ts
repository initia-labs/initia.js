import { describe, it, expect } from 'vitest'
import { HDPath, COIN_TYPE } from '../../src/key/hd-path'

describe('HDPath', () => {
  describe('COIN_TYPE constants', () => {
    it('should have correct coin type values', () => {
      expect(COIN_TYPE.INITIA).toBe(60)
      expect(COIN_TYPE.ETHEREUM).toBe(60)
      expect(COIN_TYPE.COSMOS).toBe(118)
    })
  })

  describe('factory methods', () => {
    it("initia() should return m/44'/60'/0'/0/0", () => {
      const path = HDPath.initia()
      expect(path.toString()).toBe("m/44'/60'/0'/0/0")
    })

    it("initia(5) should return m/44'/60'/0'/0/5", () => {
      const path = HDPath.initia(5)
      expect(path.toString()).toBe("m/44'/60'/0'/0/5")
    })

    it("cosmos() should return m/44'/118'/0'/0/0", () => {
      const path = HDPath.cosmos()
      expect(path.toString()).toBe("m/44'/118'/0'/0/0")
    })
  })

  describe('transformation methods', () => {
    it('index() should change address index', () => {
      const path = HDPath.initia().index(10)
      expect(path.toString()).toBe("m/44'/60'/0'/0/10")
    })

    it('account() should change account', () => {
      const path = HDPath.initia().account(2)
      expect(path.toString()).toBe("m/44'/60'/2'/0/0")
    })

    it('should be immutable (return new instance)', () => {
      const original = HDPath.initia()
      const modified = original.index(5)

      expect(original.toString()).toBe("m/44'/60'/0'/0/0")
      expect(modified.toString()).toBe("m/44'/60'/0'/0/5")
    })

    it('should support chaining', () => {
      const path = HDPath.initia().account(2).index(10)
      expect(path.toString()).toBe("m/44'/60'/2'/0/10")
    })
  })

  describe('component getters', () => {
    it('should return correct coinType', () => {
      expect(HDPath.initia().coinType).toBe(60)
      expect(HDPath.cosmos().coinType).toBe(118)
    })

    it('should return correct addressIndex', () => {
      expect(HDPath.initia().addressIndex).toBe(0)
      expect(HDPath.initia(5).addressIndex).toBe(5)
    })
  })

  describe('@scure/bip32 integration', () => {
    it('toString() should produce valid @scure/bip32 derive() path', () => {
      // This format is exactly what HDKey.derive() expects
      expect(HDPath.initia().toString()).toBe("m/44'/60'/0'/0/0")
      expect(HDPath.cosmos().toString()).toBe("m/44'/118'/0'/0/0")
    })
  })
})
