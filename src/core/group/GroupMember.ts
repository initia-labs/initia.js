import { JSONSerializable } from '../../util/json'
import { AccAddress } from '../bech32'
import {
  GroupMember as GroupMember_pb,
  Member as Member_pb,
  MemberRequest as MemberRequest_pb,
} from '@initia/initia.proto/cosmos/group/v1/types'

/**
 * GroupMember represents the relationship between a group and a member.
 */
export class GroupMember extends JSONSerializable<
  GroupMember.Amino,
  GroupMember.Data,
  GroupMember.Proto
> {
  /**
   * @param group_id the unique ID of the group
   * @param member the member data
   */
  constructor(
    public group_id: number,
    public member: Member
  ) {
    super()
  }

  public static fromAmino(data: GroupMember.Amino): GroupMember {
    const { group_id, member } = data
    return new GroupMember(parseInt(group_id), Member.fromAmino(member))
  }

  public toAmino(): GroupMember.Amino {
    const { group_id, member } = this
    return {
      group_id: group_id.toFixed(),
      member: member.toAmino(),
    }
  }

  public static fromData(data: GroupMember.Data): GroupMember {
    const { group_id, member } = data
    return new GroupMember(parseInt(group_id), Member.fromData(member))
  }

  public toData(): GroupMember.Data {
    const { group_id, member } = this
    return {
      group_id: group_id.toFixed(),
      member: member.toData(),
    }
  }

  public static fromProto(data: GroupMember.Proto): GroupMember {
    return new GroupMember(
      Number(data.groupId),
      Member.fromProto(data.member as Member)
    )
  }

  public toProto(): GroupMember.Proto {
    const { group_id, member } = this
    return GroupMember_pb.fromPartial({
      groupId: BigInt(group_id),
      member: member.toProto(),
    })
  }
}

export namespace GroupMember {
  export interface Amino {
    group_id: string
    member: Member.Amino
  }

  export interface Data {
    group_id: string
    member: Member.Data
  }

  export type Proto = GroupMember_pb
}

/**
 * Member represents a group member with an account address, non-zero weight, metadata and added_at timestamp.
 */
export class Member extends JSONSerializable<
  Member.Amino,
  Member.Data,
  Member.Proto
> {
  /**
   * @param address the member's account address
   * @param weight the member's voting weight that should be greater than 0
   * @param metadata any arbitrary metadata attached to the member
   * @param added_at timestamp specifying when a member was added
   */
  constructor(
    public address: AccAddress,
    public weight: string,
    public metadata: string,
    public added_at: Date
  ) {
    super()
  }

  public static fromAmino(data: Member.Amino): Member {
    const { address, weight, metadata, added_at } = data
    return new Member(address, weight, metadata, new Date(added_at))
  }

  public toAmino(): Member.Amino {
    const { address, weight, metadata, added_at } = this
    return {
      address,
      weight,
      metadata,
      added_at: added_at.toISOString(),
    }
  }

  public static fromData(data: Member.Data): Member {
    const { address, weight, metadata, added_at } = data
    return new Member(address, weight, metadata, new Date(added_at))
  }

  public toData(): Member.Data {
    const { address, weight, metadata, added_at } = this
    return {
      address,
      weight,
      metadata,
      added_at: added_at.toISOString(),
    }
  }

  public static fromProto(data: Member.Proto): Member {
    return new Member(
      data.address,
      data.weight,
      data.metadata,
      data.addedAt as Date
    )
  }

  public toProto(): Member.Proto {
    const { address, weight, metadata, added_at } = this
    return Member_pb.fromPartial({
      address,
      weight,
      metadata,
      addedAt: added_at,
    })
  }
}

export namespace Member {
  export interface Amino {
    address: AccAddress
    weight: string
    metadata: string
    added_at: string
  }

  export interface Data {
    address: AccAddress
    weight: string
    metadata: string
    added_at: string
  }

  export type Proto = Member_pb
}

/**
 * MemberRequest represents a group member to be used in Msg server requests.
 * Contrary to `Member`, it doesn't have any `added_at` field
 * since this field cannot be set as part of requests.
 */
export class MemberRequest extends JSONSerializable<
  MemberRequest.Amino,
  MemberRequest.Data,
  MemberRequest.Proto
> {
  /**
   * @param address the member's account address
   * @param weight the member's voting weight that should be greater than 0
   * @param metadata any arbitrary metadata attached to the member
   */
  constructor(
    public address: AccAddress,
    public weight: string,
    public metadata: string
  ) {
    super()
  }

  public static fromAmino(data: MemberRequest.Amino): MemberRequest {
    const { address, weight, metadata } = data
    return new MemberRequest(address, weight, metadata)
  }

  public toAmino(): MemberRequest.Amino {
    const { address, weight, metadata } = this
    return {
      address,
      weight,
      metadata,
    }
  }

  public static fromData(data: MemberRequest.Data): MemberRequest {
    const { address, weight, metadata } = data
    return new MemberRequest(address, weight, metadata)
  }

  public toData(): MemberRequest.Data {
    const { address, weight, metadata } = this
    return {
      address,
      weight,
      metadata,
    }
  }

  public static fromProto(data: MemberRequest.Proto): MemberRequest {
    return new MemberRequest(data.address, data.weight, data.metadata)
  }

  public toProto(): MemberRequest.Proto {
    const { address, weight, metadata } = this
    return MemberRequest_pb.fromPartial({
      address,
      weight,
      metadata,
    })
  }
}

export namespace MemberRequest {
  export interface Amino {
    address: AccAddress
    weight: string
    metadata: string
  }

  export interface Data {
    address: AccAddress
    weight: string
    metadata: string
  }

  export type Proto = MemberRequest_pb
}
