import { JSONSerializable } from '../../../util/json'
import { DecisionPolicyWindows } from './DecisionPolicyWindows'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { PercentageDecisionPolicy as PercentageDecisionPolicy_pb } from '@initia/initia.proto/cosmos/group/v1/types'

/**
 * PercentageDecisionPolicy is a decision policy where a proposal passes when
 * it satisfies the two following conditions:
 * 1. The percentage of all `YES` voters' weights out of the total group weight
 * is greater or equal than the given `percentage`.
 * 2. The voting and execution periods of the proposal respect the parameters
 * given by `windows`.
 */
export class PercentageDecisionPolicy extends JSONSerializable<
  PercentageDecisionPolicy.Amino,
  PercentageDecisionPolicy.Data,
  PercentageDecisionPolicy.Proto
> {
  /**
   * @param percentage the minimum percentage of the weighted sum of `YES` votes must meet for a proposal to succeed
   * @param windows the different windows for voting and execution
   */
  constructor(
    public percentage: string,
    public windows: DecisionPolicyWindows
  ) {
    super()
  }

  public static fromAmino(
    data: PercentageDecisionPolicy.Amino
  ): PercentageDecisionPolicy {
    const {
      value: { percentage, windows },
    } = data
    return new PercentageDecisionPolicy(
      percentage,
      DecisionPolicyWindows.fromAmino(windows)
    )
  }

  public toAmino(): PercentageDecisionPolicy.Amino {
    const { percentage, windows } = this
    return {
      type: 'cosmos-sdk/PercentageDecisionPolicy',
      value: {
        percentage,
        windows: windows.toAmino(),
      },
    }
  }

  public static fromData(
    data: PercentageDecisionPolicy.Data
  ): PercentageDecisionPolicy {
    const { percentage, windows } = data
    return new PercentageDecisionPolicy(
      percentage,
      DecisionPolicyWindows.fromData(windows)
    )
  }

  public toData(): PercentageDecisionPolicy.Data {
    const { percentage, windows } = this
    return {
      '@type': '/cosmos.group.v1.PercentageDecisionPolicy',
      percentage,
      windows: windows.toData(),
    }
  }

  public static fromProto(
    data: PercentageDecisionPolicy.Proto
  ): PercentageDecisionPolicy {
    return new PercentageDecisionPolicy(
      data.percentage,
      DecisionPolicyWindows.fromProto(
        data.windows as DecisionPolicyWindows.Proto
      )
    )
  }

  public toProto(): PercentageDecisionPolicy.Proto {
    const { percentage, windows } = this
    return PercentageDecisionPolicy_pb.fromPartial({
      percentage,
      windows: windows.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.group.v1.PercentageDecisionPolicy',
      value: PercentageDecisionPolicy_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): PercentageDecisionPolicy {
    return PercentageDecisionPolicy.fromProto(
      PercentageDecisionPolicy_pb.decode(msgAny.value)
    )
  }
}

export namespace PercentageDecisionPolicy {
  export interface Amino {
    type: 'cosmos-sdk/PercentageDecisionPolicy'
    value: {
      percentage: string
      windows: DecisionPolicyWindows.Amino
    }
  }

  export interface Data {
    '@type': '/cosmos.group.v1.PercentageDecisionPolicy'
    percentage: string
    windows: DecisionPolicyWindows.Data
  }

  export type Proto = PercentageDecisionPolicy_pb
}
