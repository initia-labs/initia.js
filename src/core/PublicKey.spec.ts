import { describe, it, expect } from 'vitest'
import {
  EthPublicKey,
  LegacyAminoMultisigPublicKey,
  SimplePublicKey,
  ValConsPublicKey,
} from './PublicKey'

describe('PublicKey', () => {
  it('Multisig address', () => {
    const pubkey = new LegacyAminoMultisigPublicKey(2, [
      new SimplePublicKey('A/PwvW/JLEnhb0/o5g+AnOqMN+FFT24gjJfDtA1tBsBv'),
      new SimplePublicKey('A9XR3uRxAD5L9kkYotz094hH6ye92YLraSO/sGhWalxb'),
      new SimplePublicKey('AyETa9Y9ihObzeRPWMP0MBAa0Mqune3I+5KonOCPTtkv'),
    ])

    expect(pubkey.address()).toEqual(
      'init1gufrav46pnpwf03yu7xz76ylkmatsxtph3uqj6'
    )
  })

  it('SimplePubkey address', () => {
    const pubkey = new SimplePublicKey(
      'AjszqFJDRAYbEjZMuiD+ChqzbUSGq/RRu3zr0R6iJB5b'
    )
    expect(pubkey.address()).toEqual(
      'init1x46rqay4d3cssq8gxxvqz8xt6nwlz4tdzavzww'
    )
  })

  it('ValCons address', () => {
    const pubkey = new ValConsPublicKey(
      'zC1zhckGr/0ZjlXkRbD575N0KC+yhWKYcEFDueBTX5o='
    )
    expect(pubkey.address()).toEqual(
      'initvalcons1mlhj044zpxqdeaajfxpnav59rp4ap38tgp3hzm'
    )
  })

  it('EthPubkey address', () => {
    const pubkey = new EthPublicKey(
      'Ahng0jM7JGSIWF38ey+qwH7T5EcUvzQqued27hn5kSgl'
    )
    expect(pubkey.address()).toEqual(
      'init18cuwmw9f423hgfl9k8d6an8p6ffvvghvtmu6l7'
    )
  })
})
