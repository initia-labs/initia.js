import { JSONSerializable } from '../../../util/json';
import { Duration } from '../../Duration';
import { DecisionPolicyWindows as DecisionPolicyWindows_pb } from '@initia/initia.proto/cosmos/group/v1/types';

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
    public voting_period: Duration,
    public min_execution_period: Duration
  ) {
    super();
  }

  public static fromAmino(
    data: DecisionPolicyWindows.Amino
  ): DecisionPolicyWindows {
    const { voting_period, min_execution_period } = data;
    return new DecisionPolicyWindows(
      Duration.fromString(voting_period),
      Duration.fromString(min_execution_period)
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
      Duration.fromString(voting_period),
      Duration.fromString(min_execution_period)
    );
  }

  public toData(): DecisionPolicyWindows.Data {
    const { voting_period, min_execution_period } = this;
    return {
      voting_period: voting_period.toString(),
      min_execution_period: min_execution_period.toString(),
    };
  }

  public static fromProto(
    data: DecisionPolicyWindows.Proto
  ): DecisionPolicyWindows {
    return new DecisionPolicyWindows(
      Duration.fromProto(data.votingPeriod as Duration.Proto),
      Duration.fromProto(data.minExecutionPeriod as Duration.Proto)
    );
  }

  public toProto(): DecisionPolicyWindows.Proto {
    const { voting_period, min_execution_period } = this;
    return DecisionPolicyWindows_pb.fromPartial({
      votingPeriod: voting_period.toProto(),
      minExecutionPeriod: min_execution_period.toProto(),
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
