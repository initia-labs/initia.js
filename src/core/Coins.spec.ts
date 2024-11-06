import { Coins } from './Coins'
import { Coin } from './Coin'

describe('Coins', () => {
  it('clobbers coins of similar denom', () => {
    const coins1 = new Coins([
      new Coin('uinit', 1000),
      new Coin('uinit', 1000),
      new Coin('uinit', 1000),
    ])

    const coinINIT = coins1.get('uinit')

    expect(coinINIT).toBeDefined()

    if (coinINIT !== undefined) {
      expect(Number(coinINIT.amount)).toEqual(3000)
    }
  })

  it('allows coins to be instantiated with a variety of inputs', () => {
    const ref = new Coins({
      uinit: 3,
    })

    // input #1: Coins
    const coins1 = new Coins(ref)

    // input #2: Coin[]
    const coins2 = new Coins([new Coin('uinit', 1), new Coin('uinit', 2)])

    // input #3: Coins.AminoDict
    const coins3 = new Coins({
      uinit: 3,
    })

    // input #4: string
    const coins4 = new Coins('2uinit,1uinit')

    for (const coin of [coins1, coins2, coins3, coins4]) {
      expect(coin).toEqual(ref)
    }
  })

  it('fromString', () => {
    const int_coins_string = '5uinit,12uinit'
    const dec_coins_string = '2.3uinit,1.45uinit'
    const neg_dec_coins_string = '-1.0uinit,2.5uinit'

    const int_coins = new Coins({
      uinit: 17,
    })
    const dec_coins = new Coins({
      uinit: 3.75,
    })

    const neg_dec_coins = new Coins({
      uinit: '1.5',
    })

    const coins1 = Coins.fromString(int_coins_string)
    const coins2 = Coins.fromString(dec_coins_string)
    const coins3 = Coins.fromString(neg_dec_coins_string)

    expect(coins1).toEqual(int_coins)
    expect(coins2).toEqual(dec_coins)
    expect(coins3).toEqual(neg_dec_coins)
  })

  it('filters', () => {
    const gasPrices = new Coins({
      uinit: '0.15',
    })

    expect(gasPrices.filter((c) => ['uinit'].includes(c.denom))).toEqual(
      new Coins({ uinit: '0.15' })
    )
  })

  it('is iterable', () => {
    const gasPrices = new Coins({
      uinit: '0.15',
    })

    // shouldn't fail or ts giving errors on type
    expect(Array.isArray(Array.from(gasPrices))).toBe(true)
  })
})
