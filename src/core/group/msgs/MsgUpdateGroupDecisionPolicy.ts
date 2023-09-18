import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { DecisionPolicy } from '../policies';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgUpdateGroupPolicyDecisionPolicy as MsgUpdateGroupPolicyDecisionPolicy_pb } from '@initia/initia.proto/cosmos/group/v1/tx';
import Long from 'long';

export class MsgUpdateGroupDecisionPolicy extends JSONSerializable<
  MsgUpdateGroupDecisionPolicy.Amino,
  MsgUpdateGroupDecisionPolicy.Data,
  MsgUpdateGroupDecisionPolicy.Proto
> {
  /**
   * @param admin the account address of the group admin
   * @param group_policy_address the account address of group policy
   * @param decision_policy the updated group policy's decision policy
   */
  constructor(
    public admin: AccAddress,
    public group_policy_address: AccAddress,
    public decision_policy: DecisionPolicy
  ) {
    super();
  }

  public static fromAmino(
    data: MsgUpdateGroupDecisionPolicy.Amino
  ): MsgUpdateGroupDecisionPolicy {
    const {
      value: { admin, group_policy_address, decision_policy },
    } = data;
    return new MsgUpdateGroupDecisionPolicy(
      admin,
      group_policy_address,
      DecisionPolicy.fromAmino(decision_policy)
    );
  }

  public toAmino(): MsgUpdateGroupDecisionPolicy.Amino {
    const { admin, group_policy_address, decision_policy } = this;
    return {
      type: 'cosmos-sdk/MsgUpdateGroupDecisionPolicy',
      value: {
        admin,
        group_policy_address,
        decision_policy: decision_policy.toAmino(),
      },
    };
  }

  public static fromData(
    data: MsgUpdateGroupDecisionPolicy.Data
  ): MsgUpdateGroupDecisionPolicy {
    const { admin, group_policy_address, decision_policy } = data;
    return new MsgUpdateGroupDecisionPolicy(
      admin,
      group_policy_address,
      DecisionPolicy.fromData(decision_policy)
    );
  }

  public toData(): MsgUpdateGroupDecisionPolicy.Data {
    const { admin, group_policy_address, decision_policy } = this;
    return {
      '@type': '/cosmos.group.v1.MsgUpdateGroupPolicyDecisionPolicy',
      admin,
      group_policy_address,
      decision_policy: decision_policy.toData(),
    };
  }

  public static fromProto(
    data: MsgUpdateGroupDecisionPolicy.Proto
  ): MsgUpdateGroupDecisionPolicy {
    return new MsgUpdateGroupDecisionPolicy(
      data.admin,
      data.groupPolicyAddress,
      DecisionPolicy.fromProto(data.decisionPolicy as DecisionPolicy.Proto)
    );
  }

  public toProto(): MsgUpdateGroupDecisionPolicy.Proto {
    const { admin, group_policy_address, decision_policy } = this;
    return MsgUpdateGroupPolicyDecisionPolicy_pb.fromPartial({
      admin,
      groupPolicyAddress: group_policy_address,
      decisionPolicy: decision_policy.packAny(),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.group.v1.MsgUpdateGroupPolicyDecisionPolicy',
      value: MsgUpdateGroupPolicyDecisionPolicy_pb.encode(
        this.toProto()
      ).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgUpdateGroupDecisionPolicy {
    return MsgUpdateGroupDecisionPolicy.fromProto(
      MsgUpdateGroupPolicyDecisionPolicy_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgUpdateGroupDecisionPolicy {
  export interface Amino {
    type: 'cosmos-sdk/MsgUpdateGroupDecisionPolicy';
    value: {
      admin: AccAddress;
      group_policy_address: AccAddress;
      decision_policy: DecisionPolicy.Amino;
    };
  }

  export interface Data {
    '@type': '/cosmos.group.v1.MsgUpdateGroupPolicyDecisionPolicy';
    admin: AccAddress;
    group_policy_address: AccAddress;
    decision_policy: DecisionPolicy.Data;
  }

  export type Proto = MsgUpdateGroupPolicyDecisionPolicy_pb;
}
