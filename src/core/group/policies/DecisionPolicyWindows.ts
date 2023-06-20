import { JSONSerializable } from '../../../util/json';
import { DecisionPolicyWindows as DecisionPolicyWindows_pb } from '@initia/initia.proto/cosmos/group/v1/types';
import Long from 'long';

export class DecisionPolicyWindows extends JSONSerializable<
  DecisionPolicyWindows.Amino,
  DecisionPolicyWindows.Data,
  DecisionPolicyWindows.Proto
> {
  /**
   * @param voting_period the duration from submission of a proposal to the end of voting period
   * @param min_execution_period the minimum duration after the proposal submission where members can start sending MsgExec
   */
  constructor(
    public voting_period: number,
    public min_execution_period: number
  ) {
    super();
  }

  public static fromAmino(
    data: DecisionPolicyWindows.Amino
  ): DecisionPolicyWindows {
    const { voting_period, min_execution_period } = data;
    return new DecisionPolicyWindows(
      Number.parseInt(voting_period),
      Number.parseInt(min_execution_period)
    );
  }

  public toAmino(): DecisionPolicyWindows.Amino {
    const { voting_period, min_execution_period } = this;
    return {
      voting_period: voting_period.toString(),
      min_execution_period: min_execution_period.toString(),
    };
  }

  public static fromData(
    data: DecisionPolicyWindows.Data
  ): DecisionPolicyWindows {
    const { voting_period, min_execution_period } = data;
    return new DecisionPolicyWindows(
      Number.parseInt(voting_period.replace('s', '')),
      Number.parseInt(min_execution_period.replace('s', ''))
    );
  }

  public toData(): DecisionPolicyWindows.Data {
    const { voting_period, min_execution_period } = this;
    return {
      voting_period: voting_period.toString() + 's',
      min_execution_period: min_execution_period.toString() + 's',
    };
  }

  public static fromProto(
    data: DecisionPolicyWindows.Proto
  ): DecisionPolicyWindows {
    return new DecisionPolicyWindows(
      data.votingPeriod?.seconds.toNumber() ?? 0,
      data.minExecutionPeriod?.seconds.toNumber() ?? 0
    );
  }

  public toProto(): DecisionPolicyWindows.Proto {
    const { voting_period, min_execution_period } = this;
    return DecisionPolicyWindows_pb.fromPartial({
      votingPeriod: { seconds: Long.fromNumber(voting_period) },
      minExecutionPeriod: { seconds: Long.fromNumber(min_execution_period) },
    });
  }
}

export namespace DecisionPolicyWindows {
  export interface Amino {
    voting_period: string;
    min_execution_period: string;
  }

  export interface Data {
    voting_period: string;
    min_execution_period: string;
  }

  export type Proto = DecisionPolicyWindows_pb;
}
