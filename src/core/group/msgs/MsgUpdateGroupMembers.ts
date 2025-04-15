import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MemberRequest } from '../GroupMember'
import { MsgUpdateGroupMembers as MsgUpdateGroupMembers_pb } from '@initia/initia.proto/cosmos/group/v1/tx'

/**
 * MsgUpdateGroupMembers updates the group members with given group id and admin address.
 */
export class MsgUpdateGroupMembers extends JSONSerializable<
  MsgUpdateGroupMembers.Amino,
  MsgUpdateGroupMembers.Data,
  MsgUpdateGroupMembers.Proto
> {
  /**
   * @param admin the account address of the group admin
   * @param group_id the unique ID of the group
   * @param member_updates list of members to update, set weight to 0 to remove a member
   */
  constructor(
    public admin: AccAddress,
    public group_id: number,
    public member_updates: MemberRequest[]
  ) {
    super()
  }

  public static fromAmino(
    data: MsgUpdateGroupMembers.Amino
  ): MsgUpdateGroupMembers {
    const {
      value: { admin, group_id, member_updates },
    } = data
    return new MsgUpdateGroupMembers(
      admin,
      parseInt(group_id),
      member_updates?.map(MemberRequest.fromAmino) ?? []
    )
  }

  public toAmino(): MsgUpdateGroupMembers.Amino {
    const { admin, group_id, member_updates } = this
    return {
      type: 'cosmos-sdk/MsgUpdateGroupMembers',
      value: {
        admin,
        group_id: group_id.toFixed(),
        member_updates:
          member_updates.length > 0
            ? member_updates.map((d) => d.toAmino())
            : null,
      },
    }
  }

  public static fromData(
    data: MsgUpdateGroupMembers.Data
  ): MsgUpdateGroupMembers {
    const { admin, group_id, member_updates } = data
    return new MsgUpdateGroupMembers(
      admin,
      parseInt(group_id),
      member_updates.map(MemberRequest.fromData)
    )
  }

  public toData(): MsgUpdateGroupMembers.Data {
    const { admin, group_id, member_updates } = this
    return {
      '@type': '/cosmos.group.v1.MsgUpdateGroupMembers',
      admin,
      group_id: group_id.toFixed(),
      member_updates: member_updates.map((d) => d.toData()),
    }
  }

  public static fromProto(
    data: MsgUpdateGroupMembers.Proto
  ): MsgUpdateGroupMembers {
    return new MsgUpdateGroupMembers(
      data.admin,
      Number(data.groupId),
      data.memberUpdates.map(MemberRequest.fromProto)
    )
  }

  public toProto(): MsgUpdateGroupMembers.Proto {
    const { admin, group_id, member_updates } = this
    return MsgUpdateGroupMembers_pb.fromPartial({
      admin,
      groupId: BigInt(group_id),
      memberUpdates: member_updates.map((d) => d.toProto()),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.group.v1.MsgUpdateGroupMembers',
      value: MsgUpdateGroupMembers_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateGroupMembers {
    return MsgUpdateGroupMembers.fromProto(
      MsgUpdateGroupMembers_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateGroupMembers {
  export interface Amino {
    type: 'cosmos-sdk/MsgUpdateGroupMembers'
    value: {
      admin: AccAddress
      group_id: string
      member_updates: MemberRequest.Amino[] | null
    }
  }

  export interface Data {
    '@type': '/cosmos.group.v1.MsgUpdateGroupMembers'
    admin: AccAddress
    group_id: string
    member_updates: MemberRequest.Data[]
  }

  export type Proto = MsgUpdateGroupMembers_pb
}
