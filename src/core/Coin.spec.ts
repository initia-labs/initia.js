import { Coin } from './Coin'

describe('Coin', () => {
  it('different types for amount', () => {
    const ref = new Coin('uinit', 1000)
    const coins = [new Coin('uinit', 1000.0), new Coin('uinit', '1000')]
    coins.forEach((coin) => expect(coin).toEqual(ref))
  })

  it('deserializes Coin value', () => {
    const coin = Coin.fromAmino({
      denom: 'uinit',
      amount: '1000',
    })

    expect(coin.denom).toEqual('uinit')
    expect(Number(coin.amount)).toEqual(1000)
  })

  it('serializes', () => {
    const coinAmino: Coin.Amino = {
      denom: 'uinit',
      amount: '1000',
    }

    const coin = Coin.fromAmino(coinAmino)
    expect(coin.toAmino()).toEqual(coinAmino)

    const decCoinAmino = {
      denom: 'uinit',
      amount: '1000.000000000000000000',
    }
    const decCoin = Coin.fromAmino(decCoinAmino)
    expect(decCoin.toAmino()).toEqual(decCoinAmino)
  })

  it('arithmetic', () => {
    const zero = new Coin('uinit', 0)
    const coin = new Coin('uinit', 1000)
    const coin2 = new Coin('uinit', 2000)

    // addition
    const sum = coin.add(coin2)
    const decSum = coin.add(0.1)
    expect(coin.add(zero).amount).toEqual(coin.amount)
    expect(Number(sum.amount)).toEqual(3000)
    expect(sum.denom).toEqual('uinit')
    expect(coin.add(1500)).toEqual(new Coin('uinit', 2500))
    expect(decSum.isDecimal).toBe(true)
    expect(Number(decSum.amount)).toEqual(1000.1)

    // subtraction
    const diff = coin2.sub(coin)
    expect(diff.denom).toEqual('uinit')
    expect(Number(diff.amount)).toEqual(1000)

    // multiplication
    const product = coin.mul(3.1233)
    expect(product.denom).toEqual('uinit')
    expect(Number(product.amount)).toEqual(3123.3)

    // division
    const quotient = coin.div(5)
    expect(quotient.denom).toEqual('uinit')
    expect(Number(quotient.amount)).toEqual(200)

    // modulo
    const rem = coin.mod(43)
    expect(rem.denom).toEqual('uinit')
    expect(Number(rem.amount)).toEqual(Number(coin.amount) % 43)
  })

  it('equality', () => {
    const coin1 = new Coin('uinit', 1000)
    const coin2 = new Coin('uinit', 1000)
    const coin3 = new Coin('uinit', 1001)
    expect(coin1).toEqual(coin2)
    expect(coin1).not.toEqual(coin3)
  })

  it('toString', () => {
    const coin1 = new Coin('uinit', 123456)
    const coin2 = new Coin('uinit', 123456.789)
    expect(coin1.toString()).toEqual('123456uinit')
    expect(coin1.toDecCoin().toString()).toEqual('123456.0uinit')
    expect(coin2.toString()).toEqual('123456.789uinit')
  })

  describe('fromString', () => {
    it('parse IntCoin', () => {
      const coin1 = new Coin('uinit', 1001)
      const coin2 = Coin.fromString('1001uinit')
      expect(coin1).toEqual(coin2)

      const coin3 = new Coin('uinit', -1)
      const coin4 = Coin.fromString('-1uinit')
      expect(coin3).toEqual(coin4)
    })

    it('parse IBC IntCoin', () => {
      const coin1 = new Coin(
        'ibc/0471F1C4E7AFD3F07702BEF6DC365268D64570F7C1FDC98EA6098DD6DE59817B',
        1001
      )
      const coin2 = Coin.fromString(
        '1001ibc/0471F1C4E7AFD3F07702BEF6DC365268D64570F7C1FDC98EA6098DD6DE59817B'
      )
      expect(coin1).toEqual(coin2)

      const coin3 = new Coin(
        'ibc/0471F1C4E7AFD3F07702BEF6DC365268D64570F7C1FDC98EA6098DD6DE59817B',
        -1
      )
      const coin4 = Coin.fromString(
        '-1ibc/0471F1C4E7AFD3F07702BEF6DC365268D64570F7C1FDC98EA6098DD6DE59817B'
      )
      expect(coin3).toEqual(coin4)
    })

    it('parse DecCoin', () => {
      const coin1 = new Coin('uinit', 1001.5)
      const coin2 = Coin.fromString('1001.500000000000000000uinit')
      expect(coin1).toEqual(coin2)

      const coin3 = new Coin('uinit', '-1.0')
      const coin4 = Coin.fromString('-1.000000000000000000uinit')
      expect(coin3).toEqual(coin4)
    })

    it('parse IBC DecCoin', () => {
      const coin1 = new Coin(
        'ibc/0471F1C4E7AFD3F07702BEF6DC365268D64570F7C1FDC98EA6098DD6DE59817B',
        1001.5
      )
      const coin2 = Coin.fromString(
        '1001.500000000000000000ibc/0471F1C4E7AFD3F07702BEF6DC365268D64570F7C1FDC98EA6098DD6DE59817B'
      )
      expect(coin1).toEqual(coin2)

      const coin3 = new Coin(
        'ibc/0471F1C4E7AFD3F07702BEF6DC365268D64570F7C1FDC98EA6098DD6DE59817B',
        '-1.0'
      )
      const coin4 = Coin.fromString(
        '-1.000000000000000000ibc/0471F1C4E7AFD3F07702BEF6DC365268D64570F7C1FDC98EA6098DD6DE59817B'
      )
      expect(coin3).toEqual(coin4)
    })
  })
})
