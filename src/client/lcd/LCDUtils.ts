import { LCDClient } from './LCDClient';
import { Validator } from '../../core/mstaking/Validator';

interface ValidatorWithVotingPower {
  validatorInfo: Validator;
  votingPower: number;
  proposerPriority: number;
}

export class LCDUtils {
  constructor(public lcd: LCDClient) {}

  /**
   * Gets current validators and merges their voting power from the validator set query.
   */
  public async validatorsWithVotingPower(): Promise<{
    [validatorAddress: string]: ValidatorWithVotingPower;
  }> {
    const [validatorSet] = await this.lcd.tendermint.validatorSet();
    const validatorSetByPubKey = validatorSet.reduce((m: any, o) => {
      m[o.pub_key.key] = o;
      return m;
    }, {});

    const validators: Validator[] = [];
    let next_key: string | undefined;
    for (;;) {
      const validatorsRes = await this.lcd.mstaking.validators({
        'pagination.key': next_key,
      });

      validators.push(...validatorsRes[0]);

      if (!validatorsRes[1].next_key) break;
      next_key = validatorsRes[1].next_key;
    }

    const res: { [k: string]: ValidatorWithVotingPower } = {};

    for (const v of validators) {
      const delegateInfo =
        validatorSetByPubKey[v.consensus_pubkey.toData().key as string];
      if (delegateInfo === undefined) continue;
      res[v.operator_address] = {
        validatorInfo: v,
        votingPower: Number.parseInt(delegateInfo.voting_power),
        proposerPriority: Number.parseInt(delegateInfo.proposer_priority),
      };
    }

    return res;
  }
}
