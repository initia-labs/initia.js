import { MnemonicKey } from './MnemonicKey'
import {
  MsgSend,
  MsgMultiSend,
  Coins,
  Fee,
  AuthInfo,
  TxBody,
  SignDoc,
  EthPublicKey,
} from '../core'

describe('MnemonicKey', () => {
  it('derives correct Key information', () => {
    const examples = [
      {
        mnemonic:
          'wonder caution square unveil april art add hover spend smile proud admit modify old copper throw crew happy nature luggage reopen exhibit ordinary napkin',
        publicKey: new EthPublicKey(
          'AhmSaN5Hkxu8LhEbG8t6wfUoO+CpNwRv8Scf8QI8eakW'
        ),
      },
      {
        mnemonic:
          'speak scatter present rice cattle sight amateur novel dizzy wheel cannon mango model sunset smooth appear impose want lunar tattoo theme zero misery flower',
        publicKey: new EthPublicKey(
          'AsrivfpnswaZkju+9LhSR1yZmZ6rKBLFKntUVRnSSfnz'
        ),
      },
      {
        mnemonic:
          'pool december kitchen crouch robot relax oppose system virtual spread pistol obtain vicious bless salmon drive repeat when frost summer render shed bone limb',
        publicKey: new EthPublicKey(
          'AuD71IRai0CDC6ASghEwQlk4flc5wefBf87mqqgVD3aI'
        ),
      },
    ]
    examples.forEach((example) => {
      const { mnemonic } = example
      const mk = new MnemonicKey({ mnemonic })
      expect(mk).toMatchObject(example)
    })
  })

  it('generates random mnemonic', () => {
    const mk = new MnemonicKey()
    const mk2 = new MnemonicKey()
    expect(mk.mnemonic).not.toEqual(mk2.mnemonic)
  })

  it('signature', async () => {
    const mk = new MnemonicKey({
      mnemonic:
        'island relax shop such yellow opinion find know caught erode blue dolphin behind coach tattoo light focus snake common size analyst imitate employ walnut',
    })
    const { accAddress } = mk

    const msgSend = new MsgSend(
      accAddress,
      'init1wlvk4e083pd3nddlfe5quy56e68atra3gu9xfs',
      new Coins({ uinit: '100000000' })
    )

    const fee = new Fee(46467, new Coins({ uinit: '698' }))
    const signDoc = new SignDoc(
      'testnet',
      45,
      0,
      new AuthInfo([], fee),
      new TxBody([msgSend])
    )

    const {
      data: { single },
    } = await mk.createSignatureAmino(signDoc)
    expect((single as any).signature).toEqual(
      'b4eRF/9nmpihcl8hwWQ+0I/L519QNPNWVe7gV68biappw0lasDuB25gDqbh50T0xPK1Dv+NJXCGhf0BZkioL/w=='
    )
  })

  it('multisig', async () => {
    const receiverAddr = 'init1ptdx6akgk7wwemlk5j73artt5t6j8am08ql3qv'
    const multisigAddr = 'init16ddrexknvk2e443jsnle4n6s2ewjc6z3mjcu6d'
    const multisigAccountNumber = 46
    const multisigSequenceNumber = 0
    const a1Key = new MnemonicKey({
      mnemonic:
        'swamp increase solar renew twelve easily possible pig ostrich harvest more indicate lion denial kind target small dumb mercy under proud arrive gentle field',
    })
    expect(a1Key.accAddress).toEqual(
      'init126h57kfhtrgymw2s453eezyfdzyememwq4ygqm'
    )
    const a2Key = new MnemonicKey({
      mnemonic:
        'service frozen keen unveil luggage initial surge name conduct mesh soup escape weather gas clown brand holiday result protect chat plug false pitch little',
    })
    expect(a2Key.accAddress).toEqual(
      'init1p2ge96yslydqumw0hhuajt5476z6hk629zlyex'
    )
    const a3Key = new MnemonicKey({
      mnemonic:
        'corn peasant blue sight spy three stove confirm night brother vote dish reduce sick observe outside vacant arena laugh devote exotic wasp supply rally',
    })
    expect(a3Key.accAddress).toEqual(
      'init15a6gp278kgfk0zuah7pp5clrd6pe5tvnu72594'
    )

    const msgSend = new MsgSend(
      multisigAddr,
      receiverAddr,
      new Coins({ uinit: 100000000 })
    )

    const signDoc = new SignDoc(
      'testnet',
      multisigAccountNumber,
      multisigSequenceNumber,
      new AuthInfo([], new Fee(50000, { uinit: 750 })),
      new TxBody([msgSend])
    )

    const a1Signature = await a1Key.createSignatureAmino(signDoc)
    expect((a1Signature.data.single as any).signature).toEqual(
      'da3tqVQl5pZjmlXFMa654wT0vItzlFOVYtsW6oy8ndJLfQnvedYIsPFksKSxSFlVnbUDc9n6E2g0Yx+/JsyQbQ=='
    )

    const a2Signature = await a2Key.createSignatureAmino(signDoc)
    expect((a2Signature.data.single as any).signature).toEqual(
      'uQmiznkolN8/7Xd5rOKMyaMI3loaJ0VgzU9fc5xic4QS6WtWdwbTiCDp/6njoilSAGv9s0JZSaqADk5EgZv0cw=='
    )

    const a3Signature = await a3Key.createSignatureAmino(signDoc)
    expect((a3Signature.data.single as any).signature).toEqual(
      'h2SQ0v2GrGrw2IJseSAHnJgCGgDChvyTIqjSfcQiqq5q8LFrb4kOYBszhpX0cQxrEqAZIIOzQAz9qOfXVQKOzw=='
    )
  })

  it('multisend', async () => {
    const key = new MnemonicKey({
      mnemonic:
        'spatial fantasy weekend romance entire million celery final moon solid route theory way hockey north trigger advice balcony melody fabric alter bullet twice push',
    })

    const signDoc = new SignDoc(
      'testnet',
      47,
      0,
      new AuthInfo([], new Fee(100000, { uinit: 1500 })),
      new TxBody(
        [
          new MsgMultiSend(
            [
              new MsgMultiSend.Input(key.accAddress, {
                uinit: 1000000,
              }),
            ],
            [
              new MsgMultiSend.Output(
                'init12dazwl3yq6nwrce052ah3fudkarglsgvacyvl9',
                {
                  uinit: 500000,
                }
              ),
              new MsgMultiSend.Output(
                'init1ptdx6akgk7wwemlk5j73artt5t6j8am08ql3qv',
                {
                  uinit: 500000,
                }
              ),
            ]
          ),
        ],
        '1234'
      )
    )

    const signature = await key.createSignatureAmino(signDoc)
    expect((signature.data.single as any).signature).toEqual(
      'mIaRgwBJiInACuTuIqQtPhYmJXaJrzVSTmvcTI/U7BYac3MDstjNglY18kVMYXjpkl7NTO34x82Egqa69GjMzA=='
    )
  })
})
