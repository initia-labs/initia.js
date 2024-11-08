import { JSONSerializable } from '../../../util/json'
import { DecisionPolicyWindows } from './DecisionPolicyWindows'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { ThresholdDecisionPolicy as ThresholdDecisionPolicy_pb } from '@initia/initia.proto/cosmos/group/v1/types'

/**
 * ThresholdDecisionPolicy is a decision policy where a proposal passes when it
 * satisfies the two following conditions:
 * 1. The sum of all `YES` voter's weights is greater or equal than the defined `threshold`.
 * 2. The voting and execution periods of the proposal respect the parameters given by `windows`.
 */
export class ThresholdDecisionPolicy extends JSONSerializable<
  ThresholdDecisionPolicy.Amino,
  ThresholdDecisionPolicy.Data,
  ThresholdDecisionPolicy.Proto
> {
  /**
   * @param threshold the minimum weighted sum of `YES` votes that must be met for a proposal to succeed
   * @param windows the different windows for voting and execution
   */
  constructor(
    public threshold: string,
    public windows: DecisionPolicyWindows
  ) {
    super()
  }

  public static fromAmino(
    data: ThresholdDecisionPolicy.Amino
  ): ThresholdDecisionPolicy {
    const {
      value: { threshold, windows },
    } = data
    return new ThresholdDecisionPolicy(
      threshold,
      DecisionPolicyWindows.fromAmino(windows)
    )
  }

  public toAmino(): ThresholdDecisionPolicy.Amino {
    const { threshold, windows } = this
    return {
      type: 'cosmos-sdk/ThresholdDecisionPolicy',
      value: {
        threshold,
        windows: windows.toAmino(),
      },
    }
  }

  public static fromData(
    data: ThresholdDecisionPolicy.Data
  ): ThresholdDecisionPolicy {
    const { threshold, windows } = data
    return new ThresholdDecisionPolicy(
      threshold,
      DecisionPolicyWindows.fromData(windows)
    )
  }

  public toData(): ThresholdDecisionPolicy.Data {
    const { threshold, windows } = this
    return {
      '@type': '/cosmos.group.v1.ThresholdDecisionPolicy',
      threshold,
      windows: windows.toData(),
    }
  }

  public static fromProto(
    data: ThresholdDecisionPolicy.Proto
  ): ThresholdDecisionPolicy {
    return new ThresholdDecisionPolicy(
      data.threshold,
      DecisionPolicyWindows.fromProto(
        data.windows as DecisionPolicyWindows.Proto
      )
    )
  }

  public toProto(): ThresholdDecisionPolicy.Proto {
    const { threshold, windows } = this
    return ThresholdDecisionPolicy_pb.fromPartial({
      threshold,
      windows: windows.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.group.v1.ThresholdDecisionPolicy',
      value: ThresholdDecisionPolicy_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): ThresholdDecisionPolicy {
    return ThresholdDecisionPolicy.fromProto(
      ThresholdDecisionPolicy_pb.decode(msgAny.value)
    )
  }
}

export namespace ThresholdDecisionPolicy {
  export interface Amino {
    type: 'cosmos-sdk/ThresholdDecisionPolicy'
    value: {
      threshold: string
      windows: DecisionPolicyWindows.Amino
    }
  }

  export interface Data {
    '@type': '/cosmos.group.v1.ThresholdDecisionPolicy'
    threshold: string
    windows: DecisionPolicyWindows.Data
  }

  export type Proto = ThresholdDecisionPolicy_pb
}
