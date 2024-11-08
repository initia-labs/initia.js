import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUpdateGroupPolicyAdmin as MsgUpdateGroupPolicyAdmin_pb } from '@initia/initia.proto/cosmos/group/v1/tx'

/**
 * MsgUpdateGroupPolicyAdmin updates a group policy admin.
 */
export class MsgUpdateGroupPolicyAdmin extends JSONSerializable<
  MsgUpdateGroupPolicyAdmin.Amino,
  MsgUpdateGroupPolicyAdmin.Data,
  MsgUpdateGroupPolicyAdmin.Proto
> {
  /**
   * @param admin the current account address of the group admin
   * @param group_policy_address the account address of group policy
   * @param new_admin the group new admin account address
   */
  constructor(
    public admin: AccAddress,
    public group_policy_address: AccAddress,
    public new_admin: AccAddress
  ) {
    super()
  }

  public static fromAmino(
    data: MsgUpdateGroupPolicyAdmin.Amino
  ): MsgUpdateGroupPolicyAdmin {
    const {
      value: { admin, group_policy_address, new_admin },
    } = data
    return new MsgUpdateGroupPolicyAdmin(admin, group_policy_address, new_admin)
  }

  public toAmino(): MsgUpdateGroupPolicyAdmin.Amino {
    const { admin, group_policy_address, new_admin } = this
    return {
      type: 'cosmos-sdk/MsgUpdateGroupPolicyAdmin',
      value: {
        admin,
        group_policy_address,
        new_admin,
      },
    }
  }

  public static fromData(
    data: MsgUpdateGroupPolicyAdmin.Data
  ): MsgUpdateGroupPolicyAdmin {
    const { admin, group_policy_address, new_admin } = data
    return new MsgUpdateGroupPolicyAdmin(admin, group_policy_address, new_admin)
  }

  public toData(): MsgUpdateGroupPolicyAdmin.Data {
    const { admin, group_policy_address, new_admin } = this
    return {
      '@type': '/cosmos.group.v1.MsgUpdateGroupPolicyAdmin',
      admin,
      group_policy_address,
      new_admin,
    }
  }

  public static fromProto(
    data: MsgUpdateGroupPolicyAdmin.Proto
  ): MsgUpdateGroupPolicyAdmin {
    return new MsgUpdateGroupPolicyAdmin(
      data.admin,
      data.groupPolicyAddress,
      data.newAdmin
    )
  }

  public toProto(): MsgUpdateGroupPolicyAdmin.Proto {
    const { admin, group_policy_address, new_admin } = this
    return MsgUpdateGroupPolicyAdmin_pb.fromPartial({
      admin,
      groupPolicyAddress: group_policy_address,
      newAdmin: new_admin,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.group.v1.MsgUpdateGroupPolicyAdmin',
      value: MsgUpdateGroupPolicyAdmin_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateGroupPolicyAdmin {
    return MsgUpdateGroupPolicyAdmin.fromProto(
      MsgUpdateGroupPolicyAdmin_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateGroupPolicyAdmin {
  export interface Amino {
    type: 'cosmos-sdk/MsgUpdateGroupPolicyAdmin'
    value: {
      admin: AccAddress
      group_policy_address: AccAddress
      new_admin: AccAddress
    }
  }

  export interface Data {
    '@type': '/cosmos.group.v1.MsgUpdateGroupPolicyAdmin'
    admin: AccAddress
    group_policy_address: AccAddress
    new_admin: AccAddress
  }

  export type Proto = MsgUpdateGroupPolicyAdmin_pb
}
