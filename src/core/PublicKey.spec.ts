import {
  LegacyAminoMultisigPublicKey,
  SimplePublicKey,
  ValConsPublicKey,
} from './PublicKey';

describe('PublicKey', () => {
  it('Multisig address', () => {
    const pubkey = new LegacyAminoMultisigPublicKey(2, [
      new SimplePublicKey('A/PwvW/JLEnhb0/o5g+AnOqMN+FFT24gjJfDtA1tBsBv'),
      new SimplePublicKey('A9XR3uRxAD5L9kkYotz094hH6ye92YLraSO/sGhWalxb'),
      new SimplePublicKey('AyETa9Y9ihObzeRPWMP0MBAa0Mqune3I+5KonOCPTtkv'),
    ]);

    expect(pubkey.address()).toEqual(
      'init1gufrav46pnpwf03yu7xz76ylkmatsxtph3uqj6'
    );
  });

  it('SimplePubkey address', () => {
    const pubkey = new SimplePublicKey(
      'AjszqFJDRAYbEjZMuiD+ChqzbUSGq/RRu3zr0R6iJB5b'
    );
    expect(pubkey.address()).toEqual(
      'init1x46rqay4d3cssq8gxxvqz8xt6nwlz4tdzavzww'
    );
  });

  it('ValCons address', () => {
    const pubkey = new ValConsPublicKey(
      'zC1zhckGr/0ZjlXkRbD575N0KC+yhWKYcEFDueBTX5o='
    );
    expect(pubkey.address()).toEqual(
      'initvalcons1mlhj044zpxqdeaajfxpnav59rp4ap38tgp3hzm'
    );
  });
});
