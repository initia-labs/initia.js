import { JSONSerializable } from '../../../util/json'
import { Duration } from '../../Duration'
import { DecisionPolicyWindows as DecisionPolicyWindows_pb } from '@initia/initia.proto/cosmos/group/v1/types'

/**
 * DecisionPolicyWindows defines the different windows for voting and execution.
 */
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
    super()
  }

  public static fromAmino(
    data: DecisionPolicyWindows.Amino
  ): DecisionPolicyWindows {
    const { voting_period, min_execution_period } = data
    return new DecisionPolicyWindows(
      Duration.fromAmino(voting_period),
      Duration.fromAmino(min_execution_period)
    )
  }

  public toAmino(): DecisionPolicyWindows.Amino {
    const { voting_period, min_execution_period } = this
    return {
      voting_period: voting_period.toAmino(),
      min_execution_period: min_execution_period.toAmino(),
    }
  }

  public static fromData(
    data: DecisionPolicyWindows.Data
  ): DecisionPolicyWindows {
    const { voting_period, min_execution_period } = data
    return new DecisionPolicyWindows(
      Duration.fromData(voting_period),
      Duration.fromData(min_execution_period)
    )
  }

  public toData(): DecisionPolicyWindows.Data {
    const { voting_period, min_execution_period } = this
    return {
      voting_period: voting_period.toData(),
      min_execution_period: min_execution_period.toData(),
    }
  }

  public static fromProto(
    data: DecisionPolicyWindows.Proto
  ): DecisionPolicyWindows {
    return new DecisionPolicyWindows(
      Duration.fromProto(data.votingPeriod as Duration.Proto),
      Duration.fromProto(data.minExecutionPeriod as Duration.Proto)
    )
  }

  public toProto(): DecisionPolicyWindows.Proto {
    const { voting_period, min_execution_period } = this
    return DecisionPolicyWindows_pb.fromPartial({
      votingPeriod: voting_period.toProto(),
      minExecutionPeriod: min_execution_period.toProto(),
    })
  }
}

export namespace DecisionPolicyWindows {
  export interface Amino {
    voting_period: Duration.Amino
    min_execution_period: Duration.Amino
  }

  export interface Data {
    voting_period: Duration.Data
    min_execution_period: Duration.Data
  }

  export type Proto = DecisionPolicyWindows_pb
}
