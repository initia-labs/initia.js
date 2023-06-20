import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { DecisionPolicy } from '../policies';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MemberRequest } from '@initia/initia.proto/cosmos/group/v1/types';
import { MsgCreateGroupWithPolicy as MsgCreateGroupWithPolicy_pb } from '@initia/initia.proto/cosmos/group/v1/tx';

export class MsgCreateGroupWithPolicy extends JSONSerializable<
  MsgCreateGroupWithPolicy.Amino,
  MsgCreateGroupWithPolicy.Data,
  MsgCreateGroupWithPolicy.Proto
> {
  /**
   * @param admin the account address of the group and group policy admin
   * @param members the group members
   * @param group_metadata any arbitrary metadata attached to the group
   * @param group_policy_metadata any arbitrary metadata attached to the group policy
   * @param group_policy_as_admin if set to true, the group policy account address will be used as group/group policy admin
   * @param decision_policy specifies the group policy's decision policy
   */
  constructor(
    public admin: AccAddress,
    public members: MemberRequest[],
    public group_metadata: string,
    public group_policy_metadata: string,
    public group_policy_as_admin: boolean,
    public decision_policy: DecisionPolicy
  ) {
    super();
  }

  public static fromAmino(
    data: MsgCreateGroupWithPolicy.Amino
  ): MsgCreateGroupWithPolicy {
    const {
      value: {
        admin,
        members,
        group_metadata,
        group_policy_metadata,
        group_policy_as_admin,
        decision_policy,
      },
    } = data;

    return new MsgCreateGroupWithPolicy(
      admin,
      members,
      group_metadata,
      group_policy_metadata,
      group_policy_as_admin,
      DecisionPolicy.fromAmino(decision_policy)
    );
  }

  public toAmino(): MsgCreateGroupWithPolicy.Amino {
    const {
      admin,
      members,
      group_metadata,
      group_policy_metadata,
      group_policy_as_admin,
      decision_policy,
    } = this;

    return {
      type: 'cosmos-sdk/MsgCreateGroupWithPolicy',
      value: {
        admin,
        members,
        group_metadata,
        group_policy_metadata,
        group_policy_as_admin,
        decision_policy: decision_policy.toAmino(),
      },
    };
  }

  public static fromData(
    data: MsgCreateGroupWithPolicy.Data
  ): MsgCreateGroupWithPolicy {
    const {
      admin,
      members,
      group_metadata,
      group_policy_metadata,
      group_policy_as_admin,
      decision_policy,
    } = data;

    return new MsgCreateGroupWithPolicy(
      admin,
      members,
      group_metadata,
      group_policy_metadata,
      group_policy_as_admin,
      DecisionPolicy.fromData(decision_policy)
    );
  }

  public toData(): MsgCreateGroupWithPolicy.Data {
    const {
      admin,
      members,
      group_metadata,
      group_policy_metadata,
      group_policy_as_admin,
      decision_policy,
    } = this;

    return {
      '@type': '/cosmos.group.v1.MsgCreateGroupWithPolicy',
      admin,
      members,
      group_metadata,
      group_policy_metadata,
      group_policy_as_admin,
      decision_policy: decision_policy.toData(),
    };
  }

  public static fromProto(
    data: MsgCreateGroupWithPolicy.Proto
  ): MsgCreateGroupWithPolicy {
    return new MsgCreateGroupWithPolicy(
      data.admin,
      data.members,
      data.groupMetadata,
      data.groupPolicyMetadata,
      data.groupPolicyAsAdmin,
      DecisionPolicy.fromProto(data.decisionPolicy as DecisionPolicy.Proto)
    );
  }

  public toProto(): MsgCreateGroupWithPolicy.Proto {
    const {
      admin,
      members,
      group_metadata,
      group_policy_metadata,
      group_policy_as_admin,
      decision_policy,
    } = this;

    return MsgCreateGroupWithPolicy_pb.fromPartial({
      admin,
      members,
      groupMetadata: group_metadata,
      groupPolicyMetadata: group_policy_metadata,
      groupPolicyAsAdmin: group_policy_as_admin,
      decisionPolicy: decision_policy.packAny(),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.group.v1.MsgCreateGroupWithPolicy',
      value: MsgCreateGroupWithPolicy_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgCreateGroupWithPolicy {
    return MsgCreateGroupWithPolicy.fromProto(
      MsgCreateGroupWithPolicy_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgCreateGroupWithPolicy {
  export interface Amino {
    type: 'cosmos-sdk/MsgCreateGroupWithPolicy';
    value: {
      admin: AccAddress;
      members: MemberRequest[];
      group_metadata: string;
      group_policy_metadata: string;
      group_policy_as_admin: boolean;
      decision_policy: DecisionPolicy.Amino;
    };
  }

  export interface Data {
    '@type': '/cosmos.group.v1.MsgCreateGroupWithPolicy';
    admin: AccAddress;
    members: MemberRequest[];
    group_metadata: string;
    group_policy_metadata: string;
    group_policy_as_admin: boolean;
    decision_policy: DecisionPolicy.Data;
  }

  export type Proto = MsgCreateGroupWithPolicy_pb;
}
