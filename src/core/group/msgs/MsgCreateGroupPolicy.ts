import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { DecisionPolicy } from '../policies'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgCreateGroupPolicy as MsgCreateGroupPolicy_pb } from '@initia/initia.proto/cosmos/group/v1/tx'
import Long from 'long'

export class MsgCreateGroupPolicy extends JSONSerializable<
  MsgCreateGroupPolicy.Amino,
  MsgCreateGroupPolicy.Data,
  MsgCreateGroupPolicy.Proto
> {
  /**
   * @param admin the account address of the group admin
   * @param group_id the unique ID of the group
   * @param metadata any arbitrary metadata attached to the group policy
   * @param decision_policy specifies the group policy's decision policy
   */
  constructor(
    public admin: AccAddress,
    public group_id: number,
    public metadata: string,
    public decision_policy: DecisionPolicy
  ) {
    super()
  }

  public static fromAmino(
    data: MsgCreateGroupPolicy.Amino
  ): MsgCreateGroupPolicy {
    const {
      value: { admin, group_id, metadata, decision_policy },
    } = data
    return new MsgCreateGroupPolicy(
      admin,
      Number.parseInt(group_id),
      metadata,
      DecisionPolicy.fromAmino(decision_policy)
    )
  }

  public toAmino(): MsgCreateGroupPolicy.Amino {
    const { admin, group_id, metadata, decision_policy } = this
    return {
      type: 'cosmos-sdk/MsgCreateGroupPolicy',
      value: {
        admin,
        group_id: group_id.toString(),
        metadata,
        decision_policy: decision_policy.toAmino(),
      },
    }
  }

  public static fromData(
    data: MsgCreateGroupPolicy.Data
  ): MsgCreateGroupPolicy {
    const { admin, group_id, metadata, decision_policy } = data
    return new MsgCreateGroupPolicy(
      admin,
      Number.parseInt(group_id),
      metadata,
      DecisionPolicy.fromData(decision_policy)
    )
  }

  public toData(): MsgCreateGroupPolicy.Data {
    const { admin, group_id, metadata, decision_policy } = this
    return {
      '@type': '/cosmos.group.v1.MsgCreateGroupPolicy',
      admin,
      group_id: group_id.toString(),
      metadata,
      decision_policy: decision_policy.toData(),
    }
  }

  public static fromProto(
    data: MsgCreateGroupPolicy.Proto
  ): MsgCreateGroupPolicy {
    return new MsgCreateGroupPolicy(
      data.admin,
      data.groupId.toNumber(),
      data.metadata,
      DecisionPolicy.fromProto(data.decisionPolicy as DecisionPolicy.Proto)
    )
  }

  public toProto(): MsgCreateGroupPolicy.Proto {
    const { admin, group_id, metadata, decision_policy } = this
    return MsgCreateGroupPolicy_pb.fromPartial({
      admin,
      groupId: Long.fromNumber(group_id),
      metadata,
      decisionPolicy: decision_policy.packAny(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.group.v1.MsgCreateGroupPolicy',
      value: MsgCreateGroupPolicy_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgCreateGroupPolicy {
    return MsgCreateGroupPolicy.fromProto(
      MsgCreateGroupPolicy_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgCreateGroupPolicy {
  export interface Amino {
    type: 'cosmos-sdk/MsgCreateGroupPolicy'
    value: {
      admin: AccAddress
      group_id: string
      metadata: string
      decision_policy: DecisionPolicy.Amino
    }
  }

  export interface Data {
    '@type': '/cosmos.group.v1.MsgCreateGroupPolicy'
    admin: AccAddress
    group_id: string
    metadata: string
    decision_policy: DecisionPolicy.Data
  }

  export type Proto = MsgCreateGroupPolicy_pb
}
