/**
 * Unit tests for Coins module.
 */

import { describe, it, expect } from 'vitest'
import { Coin, coin, DecCoin } from '../../../src/core/coin'
import { Coins, DecCoins } from '../../../src/core/coins'

// ---------------------------------------------------------------------------
// Subtask 2.1: Constructor + lookup methods
// ---------------------------------------------------------------------------

describe('Coins constructor', () => {
  it('creates empty Coins with no argument', () => {
    const cs = new Coins()
    expect(cs.isEmpty()).toBe(true)
    expect(cs.toArray()).toEqual([])
  })

  it('creates from CoinLike array', () => {
    const cs = new Coins([
      { denom: 'uinit', amount: '1000' },
      { denom: 'uusdc', amount: '500' },
    ])
    expect(cs.has('uinit')).toBe(true)
    expect(cs.has('uusdc')).toBe(true)
    expect(cs.get('uinit')?.amount).toBe('1000')
    expect(cs.get('uusdc')?.amount).toBe('500')
  })

  it('creates from Coin array', () => {
    const cs = new Coins([new Coin('uinit', 1000), new Coin('uusdc', 500)])
    expect(cs.get('uinit')?.amount).toBe('1000')
    expect(cs.get('uusdc')?.amount).toBe('500')
  })

  it('creates from Record', () => {
    const cs = new Coins({ uinit: 1000, uusdc: '500' })
    expect(cs.get('uinit')?.amount).toBe('1000')
    expect(cs.get('uusdc')?.amount).toBe('500')
  })

  it('creates from another Coins', () => {
    const a = new Coins({ uinit: 1000 })
    const b = new Coins(a)
    expect(b.get('uinit')?.amount).toBe('1000')
    expect(b).not.toBe(a)
  })

  it('merges duplicate denoms on construction', () => {
    const cs = new Coins([
      new Coin('uinit', 100),
      new Coin('uinit', 200),
    ])
    expect(cs.get('uinit')?.amount).toBe('300')
    expect(cs.toArray()).toHaveLength(1)
  })
})

describe('Coins.get', () => {
  it('returns Coin when denom exists', () => {
    const cs = new Coins({ uinit: 1000 })
    const c = cs.get('uinit')
    expect(c).toBeInstanceOf(Coin)
    expect(c?.amount).toBe('1000')
  })

  it('returns undefined when denom not found', () => {
    const cs = new Coins({ uinit: 1000 })
    expect(cs.get('uusdc')).toBeUndefined()
  })
})

describe('Coins.has', () => {
  it('returns true when denom exists', () => {
    const cs = new Coins({ uinit: 1000 })
    expect(cs.has('uinit')).toBe(true)
  })

  it('returns false when denom not found', () => {
    const cs = new Coins({ uinit: 1000 })
    expect(cs.has('uusdc')).toBe(false)
  })
})

describe('Coins.denoms', () => {
  it('returns sorted list of denoms', () => {
    // deliberately out-of-order input
    const cs = new Coins({ uusdc: 500, uinit: 1000 })
    expect(cs.denoms()).toEqual(['uinit', 'uusdc'])
  })

  it('returns empty array for empty Coins', () => {
    expect(new Coins().denoms()).toEqual([])
  })
})

describe('Coins.isEmpty', () => {
  it('returns true for empty Coins', () => {
    expect(new Coins().isEmpty()).toBe(true)
  })

  it('returns false when coins exist', () => {
    expect(new Coins({ uinit: 1000 }).isEmpty()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Subtask 2.2: Arithmetic (add / sub / mul)
// ---------------------------------------------------------------------------

describe('Coins.add', () => {
  it('sums existing denom when adding single Coin', () => {
    const cs = new Coins({ uinit: 1000 })
    const result = cs.add(new Coin('uinit', 500))
    expect(result.get('uinit')?.amount).toBe('1500')
  })

  it('inserts new denom when adding single Coin', () => {
    const cs = new Coins({ uinit: 1000 })
    const result = cs.add(new Coin('uusdc', 200))
    expect(result.get('uinit')?.amount).toBe('1000')
    expect(result.get('uusdc')?.amount).toBe('200')
  })

  it('merges multiple denoms when adding Coins', () => {
    const a = new Coins({ uinit: 1000, uusdc: 500 })
    const b = new Coins({ uinit: 200, uatom: 300 })
    const result = a.add(b)
    expect(result.get('uinit')?.amount).toBe('1200')
    expect(result.get('uusdc')?.amount).toBe('500')
    expect(result.get('uatom')?.amount).toBe('300')
  })

  it('is immutable — original unchanged after add', () => {
    const original = new Coins({ uinit: 1000 })
    original.add(new Coin('uinit', 999))
    expect(original.get('uinit')?.amount).toBe('1000')
  })
})

describe('Coins.sub', () => {
  it('subtracts single Coin from matching denom', () => {
    const cs = new Coins({ uinit: 1000 })
    const result = cs.sub(new Coin('uinit', 400))
    expect(result.get('uinit')?.amount).toBe('600')
  })

  it('allows negative results', () => {
    const cs = new Coins({ uinit: 100 })
    const result = cs.sub(new Coin('uinit', 500))
    expect(result.get('uinit')?.amountBigInt).toBe(-400n)
  })

  it('subtracts Coins (multi-denom)', () => {
    const a = new Coins({ uinit: 1000, uusdc: 500 })
    const b = new Coins({ uinit: 300, uusdc: 200 })
    const result = a.sub(b)
    expect(result.get('uinit')?.amount).toBe('700')
    expect(result.get('uusdc')?.amount).toBe('300')
  })

  it('sub with absent denom creates negative entry', () => {
    const cs = new Coins({ uinit: 100 })
    const result = cs.sub(coin('uatom', 50))
    expect(result.get('uatom')?.amount).toBe('-50')
    expect(result.get('uinit')?.amount).toBe('100')
  })

  it('sub is immutable — original unchanged', () => {
    const cs = new Coins({ uinit: 1000 })
    cs.sub(coin('uinit', 500))
    expect(cs.get('uinit')?.amount).toBe('1000')
  })
})

describe('Coins.safeSub', () => {
  it('succeeds when balance is sufficient', () => {
    const cs = new Coins({ uinit: 1000, uusdc: 500 })
    const result = cs.safeSub(new Coins({ uinit: 300, uusdc: 200 }))
    expect(result.get('uinit')?.amount).toBe('700')
    expect(result.get('uusdc')?.amount).toBe('300')
  })

  it('throws when any denom goes negative', () => {
    const cs = new Coins({ uinit: 100 })
    expect(() => cs.safeSub(coin('uinit', 500))).toThrow('Insufficient balance for uinit')
  })

  it('throws when subtracting absent denom', () => {
    const cs = new Coins({ uinit: 100 })
    expect(() => cs.safeSub(coin('uatom', 50))).toThrow('Insufficient balance for uatom')
  })

  it('throws when first denom OK but second insufficient', () => {
    const cs = new Coins({ uinit: 1000, uusdc: 10 })
    expect(() => cs.safeSub(new Coins({ uinit: 100, uusdc: 500 }))).toThrow('uusdc')
  })

  it('succeeds with exact zero result', () => {
    const cs = new Coins({ uinit: 100 })
    const result = cs.safeSub(coin('uinit', 100))
    expect(result.get('uinit')?.amountBigInt).toBe(0n)
  })
})

describe('Coins.mul', () => {
  it('multiplies all denoms by scalar (number)', () => {
    const cs = new Coins({ uinit: 1000, uusdc: 500 })
    const result = cs.mul(3)
    expect(result.get('uinit')?.amount).toBe('3000')
    expect(result.get('uusdc')?.amount).toBe('1500')
  })

  it('multiplies all denoms by scalar (bigint)', () => {
    const cs = new Coins({ uinit: 100 })
    const result = cs.mul(2n)
    expect(result.get('uinit')?.amount).toBe('200')
  })
})

// ---------------------------------------------------------------------------
// Subtask 2.3: Functional methods + toProto + toString
// ---------------------------------------------------------------------------

describe('Coins.map', () => {
  it('maps over coins in sorted denom order', () => {
    const cs = new Coins({ uusdc: 500, uinit: 1000 })
    const denoms = cs.map(c => c.denom)
    expect(denoms).toEqual(['uinit', 'uusdc'])
  })
})

describe('Coins.filter', () => {
  it('returns new Coins satisfying predicate', () => {
    const cs = new Coins({ uinit: 1000, uusdc: 0 })
    const result = cs.filter(c => c.amountBigInt > 0n)
    expect(result.has('uinit')).toBe(true)
    expect(result.has('uusdc')).toBe(false)
  })
})

describe('Coins.find', () => {
  it('returns matching Coin', () => {
    const cs = new Coins({ uinit: 1000, uusdc: 500 })
    const found = cs.find(c => c.denom === 'uusdc')
    expect(found?.amount).toBe('500')
  })

  it('returns undefined when not found', () => {
    const cs = new Coins({ uinit: 1000 })
    expect(cs.find(c => c.denom === 'uatom')).toBeUndefined()
  })
})

describe('Coins.toProto', () => {
  it('returns sorted proto-compatible array', () => {
    const cs = new Coins({ uusdc: 500, uinit: 1000 })
    const proto = cs.toProto()
    expect(proto).toHaveLength(2)
    expect(proto[0].denom).toBe('uinit')
    expect(proto[0].amount).toBe('1000')
    expect(proto[1].denom).toBe('uusdc')
    expect(proto[1].amount).toBe('500')
  })
})

describe('Coins.toString', () => {
  it('formats as sorted comma-separated coins', () => {
    const cs = new Coins({ uusdc: 500, uinit: 1000 })
    expect(cs.toString()).toBe('1000uinit,500uusdc')
  })

  it('returns empty string for empty Coins', () => {
    expect(new Coins().toString()).toBe('')
  })
})

describe('Coins iterator', () => {
  it('iterates in sorted denom order', () => {
    const cs = new Coins({ uusdc: 500, uinit: 1000, uatom: 200 })
    const denoms = [...cs].map(c => c.denom)
    expect(denoms).toEqual(['uatom', 'uinit', 'uusdc'])
  })
})

describe('Coins.toDecCoins', () => {
  it('converts each coin to a DecCoin with 18 fractional zeros', () => {
    const cs = new Coins({ uinit: 42 })
    const dec = cs.toDecCoins()
    const arr = dec.toArray()
    expect(arr).toHaveLength(1)
    expect(arr[0]?.denom).toBe('uinit')
    expect(arr[0]?.amount).toBe('42.000000000000000000')
  })

  it('returns a real DecCoins instance', () => {
    const cs = new Coins({ uinit: 42 })
    const dec = cs.toDecCoins()
    expect(dec).toBeInstanceOf(DecCoins)
  })
})

// ---------------------------------------------------------------------------
// Subtask 3.1: DecCoins constructor + lookup
// ---------------------------------------------------------------------------

describe('DecCoins constructor', () => {
  it('creates empty DecCoins with no argument', () => {
    const dc = new DecCoins()
    expect(dc.isEmpty()).toBe(true)
    expect(dc.toArray()).toEqual([])
  })

  it('creates from proto-compatible array', () => {
    const dc = new DecCoins([
      { denom: 'uinit', amount: '1.5' },
      { denom: 'uusdc', amount: '2.0' },
    ])
    expect(dc.has('uinit')).toBe(true)
    expect(dc.has('uusdc')).toBe(true)
    expect(dc.get('uinit')?.amount).toBe('1.500000000000000000')
    expect(dc.get('uusdc')?.amount).toBe('2.000000000000000000')
  })

  it('creates from DecCoin array', () => {
    const dc = new DecCoins([new DecCoin('uinit', '1.5'), new DecCoin('uusdc', '2.0')])
    expect(dc.get('uinit')?.amount).toBe('1.500000000000000000')
    expect(dc.get('uusdc')?.amount).toBe('2.000000000000000000')
  })

  it('creates from Record<string, string>', () => {
    const dc = new DecCoins({ uinit: '1.5', uusdc: '0.5' })
    expect(dc.get('uinit')?.amount).toBe('1.500000000000000000')
    expect(dc.get('uusdc')?.amount).toBe('0.500000000000000000')
  })

  it('creates from another DecCoins (copy constructor)', () => {
    const a = new DecCoins({ uinit: '1.5' })
    const b = new DecCoins(a)
    expect(b.get('uinit')?.amount).toBe('1.500000000000000000')
    expect(b).not.toBe(a)
  })

  it('merges duplicate denoms using DecCoin.add()', () => {
    const dc = new DecCoins([
      new DecCoin('uinit', '1.5'),
      new DecCoin('uinit', '0.5'),
    ])
    // 1.5 + 0.5 = 2.000000000000000000 (normalized)
    expect(dc.get('uinit')?.eq(new DecCoin('uinit', '2'))).toBe(true)
    expect(dc.toArray()).toHaveLength(1)
  })
})

describe('DecCoins.get', () => {
  it('returns DecCoin when denom exists', () => {
    const dc = new DecCoins({ uinit: '1.5' })
    const c = dc.get('uinit')
    expect(c).toBeInstanceOf(DecCoin)
    expect(c?.amount).toBe('1.500000000000000000')
  })

  it('returns undefined when denom not found', () => {
    const dc = new DecCoins({ uinit: '1.5' })
    expect(dc.get('uusdc')).toBeUndefined()
  })
})

describe('DecCoins.has', () => {
  it('returns true when denom exists', () => {
    const dc = new DecCoins({ uinit: '1.5' })
    expect(dc.has('uinit')).toBe(true)
  })

  it('returns false when denom not found', () => {
    const dc = new DecCoins({ uinit: '1.5' })
    expect(dc.has('uusdc')).toBe(false)
  })
})

describe('DecCoins.denoms', () => {
  it('returns sorted list of denoms', () => {
    const dc = new DecCoins({ uusdc: '0.5', uinit: '1.5' })
    expect(dc.denoms()).toEqual(['uinit', 'uusdc'])
  })

  it('returns empty array for empty DecCoins', () => {
    expect(new DecCoins().denoms()).toEqual([])
  })
})

describe('DecCoins.isEmpty', () => {
  it('returns true for empty DecCoins', () => {
    expect(new DecCoins().isEmpty()).toBe(true)
  })

  it('returns false when coins exist', () => {
    expect(new DecCoins({ uinit: '1.5' }).isEmpty()).toBe(false)
  })
})

describe('DecCoins.toArray', () => {
  it('returns coins sorted by denom', () => {
    const dc = new DecCoins({ uusdc: '0.5', uinit: '1.5' })
    const arr = dc.toArray()
    expect(arr.map(c => c.denom)).toEqual(['uinit', 'uusdc'])
  })
})

describe('DecCoins iterator', () => {
  it('iterates in sorted denom order', () => {
    const dc = new DecCoins({ uusdc: '0.5', uinit: '1.5', uatom: '0.2' })
    const denoms = [...dc].map(c => c.denom)
    expect(denoms).toEqual(['uatom', 'uinit', 'uusdc'])
  })
})

// ---------------------------------------------------------------------------
// Subtask 3.2: Arithmetic + functional + conversion
// ---------------------------------------------------------------------------

describe('DecCoins.add', () => {
  it('sums existing denom when adding single DecCoin', () => {
    const dc = new DecCoins({ uinit: '1.5' })
    const result = dc.add(new DecCoin('uinit', '0.5'))
    expect(result.get('uinit')?.eq(new DecCoin('uinit', '2'))).toBe(true)
  })

  it('inserts new denom when adding single DecCoin', () => {
    const dc = new DecCoins({ uinit: '1.5' })
    const result = dc.add(new DecCoin('uusdc', '0.5'))
    expect(result.has('uinit')).toBe(true)
    expect(result.has('uusdc')).toBe(true)
  })

  it('merges multiple denoms when adding DecCoins', () => {
    const a = new DecCoins({ uinit: '1.5', uusdc: '0.5' })
    const b = new DecCoins({ uinit: '0.5', uatom: '0.3' })
    const result = a.add(b)
    expect(result.get('uinit')?.eq(new DecCoin('uinit', '2'))).toBe(true)
    expect(result.has('uusdc')).toBe(true)
    expect(result.has('uatom')).toBe(true)
  })

  it('is immutable — original unchanged after add', () => {
    const original = new DecCoins({ uinit: '1.5' })
    original.add(new DecCoin('uinit', '9.9'))
    expect(original.get('uinit')?.amount).toBe('1.500000000000000000')
  })
})

describe('DecCoins.sub', () => {
  it('subtracts single DecCoin from matching denom', () => {
    const dc = new DecCoins({ uinit: '2.0' })
    const result = dc.sub(new DecCoin('uinit', '0.5'))
    expect(result.get('uinit')?.eq(new DecCoin('uinit', '1.5'))).toBe(true)
  })

  it('subtracts DecCoins (multi-denom)', () => {
    const a = new DecCoins({ uinit: '2.0', uusdc: '1.0' })
    const b = new DecCoins({ uinit: '0.5', uusdc: '0.25' })
    const result = a.sub(b)
    expect(result.get('uinit')?.eq(new DecCoin('uinit', '1.5'))).toBe(true)
    expect(result.get('uusdc')?.eq(new DecCoin('uusdc', '0.75'))).toBe(true)
  })

  it('sub with absent denom creates negative entry', () => {
    const dcs = new DecCoins({ uinit: '1.000000000000000000' })
    const result = dcs.sub(new DecCoin('uatom', '0.500000000000000000'))
    expect(result.get('uatom')?.amount).toBe('-0.500000000000000000')
    expect(result.get('uinit')?.amount).toBe('1.000000000000000000')
  })
})

describe('DecCoins.safeSub', () => {
  it('succeeds when balance is sufficient', () => {
    const dc = new DecCoins({ uinit: '1.5', uusdc: '0.5' })
    const result = dc.safeSub(new DecCoin('uinit', '0.3'))
    expect(result.get('uinit')?.amount).toContain('1.2')
  })

  it('throws when any denom goes negative', () => {
    const dc = new DecCoins({ uinit: '0.1' })
    expect(() => dc.safeSub(new DecCoin('uinit', '0.5'))).toThrow('Insufficient balance for uinit')
  })

  it('succeeds with exact zero result', () => {
    const dc = new DecCoins({ uinit: '1.0' })
    const result = dc.safeSub(new DecCoin('uinit', '1.0'))
    expect(result.get('uinit')?.amount).toBe('0.000000000000000000')
  })
})

describe('DecCoins.mul', () => {
  it('multiplies all denoms by scalar (number)', () => {
    const dc = new DecCoins({ uinit: '1.5', uusdc: '0.5' })
    const result = dc.mul(2)
    expect(result.get('uinit')?.eq(new DecCoin('uinit', '3'))).toBe(true)
    expect(result.get('uusdc')?.eq(new DecCoin('uusdc', '1'))).toBe(true)
  })

  it('multiplies all denoms by scalar (bigint)', () => {
    const dc = new DecCoins({ uinit: '1.5' })
    const result = dc.mul(2n)
    expect(result.get('uinit')?.eq(new DecCoin('uinit', '3'))).toBe(true)
  })
})

describe('DecCoins functional methods', () => {
  it('filter returns new DecCoins satisfying predicate', () => {
    const dc = new DecCoins({ uinit: '1.5', uusdc: '0.0' })
    const result = dc.filter(c => c.gt(new DecCoin(c.denom, '0')))
    expect(result.has('uinit')).toBe(true)
    expect(result.has('uusdc')).toBe(false)
  })

  it('map returns array of transformed values', () => {
    const dc = new DecCoins({ uusdc: '0.5', uinit: '1.5' })
    const denoms = dc.map(c => c.denom)
    expect(denoms).toEqual(['uinit', 'uusdc'])
  })

  it('find returns matching DecCoin', () => {
    const dc = new DecCoins({ uinit: '1.5', uusdc: '0.5' })
    const found = dc.find(c => c.denom === 'uusdc')
    expect(found?.amount).toBe('0.500000000000000000')
  })

  it('find returns undefined when not found', () => {
    const dc = new DecCoins({ uinit: '1.5' })
    expect(dc.find(c => c.denom === 'uatom')).toBeUndefined()
  })
})

describe('DecCoins.toProto', () => {
  it('returns sorted proto-compatible array', () => {
    const dc = new DecCoins({ uusdc: '0.5', uinit: '1.5' })
    const proto = dc.toProto()
    expect(proto).toHaveLength(2)
    expect(proto[0].denom).toBe('uinit')
    expect(proto[0].amount).toBe('1.500000000000000000')
    expect(proto[1].denom).toBe('uusdc')
    expect(proto[1].amount).toBe('0.500000000000000000')
  })
})

describe('DecCoins.toString', () => {
  it('formats as sorted comma-separated dec coins', () => {
    const dc = new DecCoins({ uusdc: '0.5', uinit: '1.5' })
    expect(dc.toString()).toBe('1.500000000000000000uinit,0.500000000000000000uusdc')
  })

  it('returns empty string for empty DecCoins', () => {
    expect(new DecCoins().toString()).toBe('')
  })
})

describe('DecCoins.toIntCoins', () => {
  it('truncates fractional parts toward zero', () => {
    const dc = new DecCoins({ uinit: '1.9', uusdc: '2.1' })
    const coins = dc.toIntCoins()
    expect(coins).toBeInstanceOf(Coins)
    expect(coins.get('uinit')?.amount).toBe('1')
    expect(coins.get('uusdc')?.amount).toBe('2')
  })
})

describe('DecCoins.toIntCeilCoins', () => {
  it('ceilings fractional parts away from zero', () => {
    const dc = new DecCoins({ uinit: '1.1', uusdc: '2.9' })
    const coins = dc.toIntCeilCoins()
    expect(coins).toBeInstanceOf(Coins)
    expect(coins.get('uinit')?.amount).toBe('2')
    expect(coins.get('uusdc')?.amount).toBe('3')
  })
})
