import {
  AccAddress,
  ValAddress,
  AccPubKey,
  ValPubKey,
  ValConsAddress,
} from './bech32';
import { bech32 } from 'bech32';

describe('AccAddress', () => {
  it('validates account address', () => {
    expect(
      AccAddress.validate('initvaloper1pdx498r0hrc2fj36sjhs8vuhrz9hd2cw0yhqtk')
    ).toBe(false);

    expect(
      AccAddress.validate('init1pdx498r0h7c2fj36sjhs8vu8rz9hd2cw0tmam9')
    ).toBe(false); // bad checksum

    expect(
      AccAddress.validate('cosmos176m2p8l3fps3dal7h8gf9jvrv98tu3rqfdht86')
    ).toBe(false);

    const words = bech32.toWords(Buffer.from('foobar', 'utf8'));
    const badAddress = bech32.encode('init', words);

    expect(AccAddress.validate(badAddress)).toBe(false);
    expect(
      AccAddress.validate('init1wlvk4e083pd3nddlfe5quy56e68atra3gu9xfs')
    ).toBe(true);
  });

  it('converts from validator address', () => {
    expect(
      AccAddress.fromValAddress(
        'initvaloper1wlvk4e083pd3nddlfe5quy56e68atra3ueul8q'
      )
    ).toEqual('init1wlvk4e083pd3nddlfe5quy56e68atra3gu9xfs');
  });
});

describe('ValAddress', () => {
  it('validates validator address', () => {
    const words = bech32.toWords(Buffer.from('foobar', 'utf8'));
    const badAddress = bech32.encode('initvaloper', words);

    expect(ValAddress.validate(badAddress)).toBe(false);

    expect(
      ValAddress.validate('initvaloper1wlvk4e083pd3nddlfe5quy56e68atra3ueul8q')
    ).toBe(true);
  });

  it('converts from account address', () => {
    expect(
      ValAddress.fromAccAddress('init1wlvk4e083pd3nddlfe5quy56e68atra3gu9xfs')
    ).toEqual('initvaloper1wlvk4e083pd3nddlfe5quy56e68atra3ueul8q');
  });
});

describe('AccPubKey', () => {
  it('validates account pubkey', () => {
    expect(
      AccPubKey.validate(
        'initvaloperpub1addwnpepqt8ha594svjn3nvfk4ggfn5n8xd3sm3cz6ztxyugwcuqzsuuhhfq5y7accr'
      )
    ).toBe(false);

    const words = bech32.toWords(Buffer.from('foobar', 'utf8'));
    const badPubKey = bech32.encode('initpub', words);

    expect(AccPubKey.validate(badPubKey)).toBe(false);
    expect(
      AccPubKey.validate('initpub1wlvk4e083pd3nddlfe5quy56e68atra352764k')
    ).toBe(true);
  });

  it('converts from validator pubkey', () => {
    expect(
      AccPubKey.fromAccAddress('init1wlvk4e083pd3nddlfe5quy56e68atra3gu9xfs')
    ).toEqual('initpub1wlvk4e083pd3nddlfe5quy56e68atra352764k');
  });
});

describe('ValPubKey', () => {
  it('validates validator pubkey', () => {
    expect(
      ValPubKey.validate(
        'initvaloperpub1wlvk4e083pd3nddlfe5quy56e68atra3sx35rr'
      )
    ).toBe(true);

    const words = bech32.toWords(Buffer.from('foobar', 'utf8'));
    const badPubKey = bech32.encode('initpub', words);

    expect(ValPubKey.validate(badPubKey)).toBe(false);
    expect(
      ValPubKey.validate('initvaloper1wlvk4e083pd3nddlfe5quy56e68atra3ueul8q')
    ).toBe(false);
  });

  it('converts from validator address', () => {
    expect(
      ValPubKey.fromValAddress(
        'initvaloper1wlvk4e083pd3nddlfe5quy56e68atra3ueul8q'
      )
    ).toEqual('initvaloperpub1wlvk4e083pd3nddlfe5quy56e68atra3sx35rr');
  });
});

describe('ValConsAddress', () => {
  it('validate validator consensus address', () => {
    expect(
      ValConsAddress.validate(
        'initvalcons1wlvk4e083pd3nddlfe5quy56e68atra3g20rtp'
      )
    ).toBeTruthy();
  });
});
