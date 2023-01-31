import { MnemonicKey } from './MnemonicKey';
import { MsgSend, MsgMultiSend } from '../core/bank/msgs';
import { Coins } from '../core/Coins';
import { Fee } from '../core/Fee';
import { AuthInfo, TxBody } from '../core/Tx';
import { SignDoc } from '../core/SignDoc';
import { SimplePublicKey } from '../core';

describe('MnemonicKey', () => {
  it('derives correct Key information', () => {
    const examples = [
      {
        mnemonic:
          'wonder caution square unveil april art add hover spend smile proud admit modify old copper throw crew happy nature luggage reopen exhibit ordinary napkin',
        publicKey: new SimplePublicKey(
          'Az7m8AhXzoEh/OZ3DlZjhxPSNz3Ft0La35EDFkwiuRmi'
        ),
      },
      {
        mnemonic:
          'speak scatter present rice cattle sight amateur novel dizzy wheel cannon mango model sunset smooth appear impose want lunar tattoo theme zero misery flower',
        publicKey: new SimplePublicKey(
          'Awrtf/xWWRXXB8aeyrFr4XpCQOWR7e8zMa778/DnCmOr'
        ),
      },
      {
        mnemonic:
          'pool december kitchen crouch robot relax oppose system virtual spread pistol obtain vicious bless salmon drive repeat when frost summer render shed bone limb',
        publicKey: new SimplePublicKey(
          'AtBxnfDCovu59noUv6GOh7eXkumkzja6bbp8uPhm12Op'
        ),
      },
    ];
    examples.forEach(example => {
      const { mnemonic } = example;
      const mk = new MnemonicKey({ mnemonic });
      expect(mk).toMatchObject(example);
    });
  });

  it('generates random mnemonic', () => {
    const mk = new MnemonicKey();
    const mk2 = new MnemonicKey();
    expect(mk.mnemonic).not.toEqual(mk2.mnemonic);
  });

  it('signature', async () => {
    const mk = new MnemonicKey({
      mnemonic:
        'island relax shop such yellow opinion find know caught erode blue dolphin behind coach tattoo light focus snake common size analyst imitate employ walnut',
    });
    const { accAddress } = mk;

    const msgSend = new MsgSend(
      accAddress,
      'init1wlvk4e083pd3nddlfe5quy56e68atra3gu9xfs',
      new Coins({ uinit: '100000000' })
    );

    const fee = new Fee(46467, new Coins({ uinit: '698' }));
    const signDoc = new SignDoc(
      'testnet',
      45,
      0,
      new AuthInfo([], fee),
      new TxBody([msgSend])
    );

    const { data: { single } } = mk.createSignatureAmino(signDoc);
    expect((single as any).signature).toEqual(
      '1Ilhp30yhTh0ehXYA1cenO+Vmg5X+7/EPTs56jSTq71stuUS+UyqcCUV3Li6LLMMsWQz0of4UaggtNcB0ghsDg=='
    );
  });

  it('multisig', async () => {
    const receiverAddr = 'init1ptdx6akgk7wwemlk5j73artt5t6j8am08ql3qv';
    const multisigAddr = 'init16ddrexknvk2e443jsnle4n6s2ewjc6z3mjcu6d';
    const multisigAccountNumber = 46;
    const multisigSequenceNumber = 0;
    const a1Key = new MnemonicKey({
      mnemonic:
        'swamp increase solar renew twelve easily possible pig ostrich harvest more indicate lion denial kind target small dumb mercy under proud arrive gentle field',
    });
    expect(a1Key.accAddress).toEqual(
      'init1gknfqc7lr2djyf0ttzp6mmdvq3wp5gf0rd2h6s'
    );
    const a2Key = new MnemonicKey({
      mnemonic:
        'service frozen keen unveil luggage initial surge name conduct mesh soup escape weather gas clown brand holiday result protect chat plug false pitch little',
    });
    expect(a2Key.accAddress).toEqual(
      'init1cz7urn9f27kelsam6m4tlsegfcapp2hwhtjmqe'
    );
    const a3Key = new MnemonicKey({
      mnemonic:
        'corn peasant blue sight spy three stove confirm night brother vote dish reduce sick observe outside vacant arena laugh devote exotic wasp supply rally',
    });
    expect(a3Key.accAddress).toEqual(
      'init1hkehyn7dlvwssrhf3kwxf9azwm3pn8wjqhfpld'
    );

    const msgSend = new MsgSend(
      multisigAddr,
      receiverAddr,
      new Coins({ uinit: 100000000 })
    );

    const signDoc = new SignDoc(
      'testnet',
      multisigAccountNumber,
      multisigSequenceNumber,
      new AuthInfo([], new Fee(50000, { uinit: 750 })),
      new TxBody([msgSend])
    );

    const a1Signature = a1Key.createSignatureAmino(signDoc);
    expect((a1Signature.data.single as any).signature).toEqual(
      'pM+jWKC0Ks4OaHkk/czkpndbw0C1GkbqYuCLBjBa+3ZtdSa3ydwjPMHCSbBn3seXLJde00xN+O0l++jZRiuelg=='
    );

    const a2Signature = a2Key.createSignatureAmino(signDoc);
    expect((a2Signature.data.single as any).signature).toEqual(
      'FHkESKoEjtoEKLT6/GvU5bSorJiWrcNC+rvvTnuJizdSz0Vukp1PmFSzbqNNga7pjfT5bUI1yYKJVavocsk9bA=='
    );

    const a3Signature = a3Key.createSignatureAmino(signDoc);
    expect((a3Signature.data.single as any).signature).toEqual(
      'a4DpYLsiAjiQO67bqgy0QW858u4B6b8mG/e0CG7AjD1g90qestY9k8223AJ2KbGEeif4svZXCfIUnDMf+0qU3w=='
    );
  });

  it('multisend', async () => {
    const key = new MnemonicKey({
      mnemonic:
        'spatial fantasy weekend romance entire million celery final moon solid route theory way hockey north trigger advice balcony melody fabric alter bullet twice push',
    });

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
    );

    const signature = key.createSignatureAmino(signDoc);
    expect((signature.data.single as any).signature).toEqual(
      'co8B8a2H4JLWfSrn7+rKmV4sMG/xmKxkEBe66xpDFgceZoyt9wWWPkQKfN1hg4tssz+p0+4rQgfqjBEJUxDAfA=='
    );
  });
});
