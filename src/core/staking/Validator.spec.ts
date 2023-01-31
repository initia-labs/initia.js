import { Validator } from './Validator';
import { ValConsPublicKey } from '../PublicKey';
import { Coins } from '../Coins';
import { Coin } from '../Coin';

describe('Validator', () => {
  it('deserializes', () => {
    const validator = Validator.fromAmino({
      operator_address: 'initvaloper1y3qwj2nf2x9gc6ctgt4vzh6e3q23cy9xz2gn99',
      consensus_pubkey: {
        type: 'tendermint/PubKeyEd25519',
        value: '7FEsWru0BfqtqoGmqMEvgUOgL2kwhUi7dMplE6muoAo=',
      },
      jailed: false,
      status: 2,
      tokens: [
        { denom: 'move/975343fbd246bd169757499d5220021114bb32acede722c65180e9f199d19615', amount: '5725331862' },
        { denom: 'ustake', amount: '20000000' },
      ],
      delegator_shares: [
        { denom: 'move/975343fbd246bd169757499d5220021114bb32acede722c65180e9f199d19615', amount: '5725331862.000000000000000000' },
        { denom: 'ustake', amount: '20000000.000000000000000000' },
      ],
      description: {
        moniker: 'WeStaking',
        identity: 'DA9C5AD3E308E426',
        website: 'https://www.westaking.io',
        details:
          'Delegate your initia to us for the staking rewards. We will do our best as secure and stable validator.',
        security_contact: 'x@x.com',
      },
      unbonding_height: '0',
      unbonding_time: '1970-01-01T00:00:00Z',
      commission: {
        commission_rates: {
          rate: '0.100000000000000000',
          max_rate: '0.200000000000000000',
          max_change_rate: '0.010000000000000000',
        },
        update_time: '2023-01-26T06:28:02.349271477Z',
      },
      voting_powers: [
        { denom: 'move/975343fbd246bd169757499d5220021114bb32acede722c65180e9f199d19615', amount: '5725331862' },
        { denom: 'ustake', amount: '20000000' },
      ],
      voting_power: '5745331862',
    });

    expect(validator).toMatchObject({
      operator_address: 'initvaloper1y3qwj2nf2x9gc6ctgt4vzh6e3q23cy9xz2gn99',
      consensus_pubkey: new ValConsPublicKey(
        '7FEsWru0BfqtqoGmqMEvgUOgL2kwhUi7dMplE6muoAo='
      ),
      jailed: false,
      status: 2,
      tokens: new Coins({
        'move/975343fbd246bd169757499d5220021114bb32acede722c65180e9f199d19615': '5725331862',
        ustake: '20000000',
      }),
      delegator_shares: new Coins({
        'move/975343fbd246bd169757499d5220021114bb32acede722c65180e9f199d19615': '5725331862.000000000000000000',
        ustake: '20000000.000000000000000000',
      }),
      description: {
        moniker: 'WeStaking',
        identity: 'DA9C5AD3E308E426',
        website: 'https://www.westaking.io',
        details:
          'Delegate your initia to us for the staking rewards. We will do our best as secure and stable validator.',
        security_contact: 'x@x.com',
      },
      unbonding_height: 0,
      unbonding_time: new Date('1970-01-01T00:00:00Z'),
      commission: {
        commission_rates: {
          rate: '0.1',
          max_rate: '0.2',
          max_change_rate: '0.01',
        },
        update_time: new Date('2023-01-26T06:28:02.349271477Z'),
      },
      voting_powers: new Coins({
        'move/975343fbd246bd169757499d5220021114bb32acede722c65180e9f199d19615': 5725331862,
        ustake: 20000000,
      }),
      voting_power: '5745331862',
    });
  });
});
