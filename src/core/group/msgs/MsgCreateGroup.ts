import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MemberRequest } from '../GroupMember';
import { MsgCreateGroup as MsgCreateGroup_pb } from '@initia/initia.proto/cosmos/group/v1/tx';

export class MsgCreateGroup extends JSONSerializable<
  MsgCreateGroup.Amino,
  MsgCreateGroup.Data,
  MsgCreateGroup.Proto
> {
  /**
   * @param admin the account address of the group admin
   * @param members the group members
   * @param metadata any arbitrary metadata to attached to the group
   */
  constructor(
    public admin: AccAddress,
    public members: MemberRequest[],
    public metadata: string
  ) {
    super();
  }

  public static fromAmino(data: MsgCreateGroup.Amino): MsgCreateGroup {
    const {
      value: { admin, members, metadata },
    } = data;
    return new MsgCreateGroup(
      admin,
      members.map(MemberRequest.fromAmino),
      metadata
    );
  }

  public toAmino(): MsgCreateGroup.Amino {
    const { admin, members, metadata } = this;
    return {
      type: 'cosmos-sdk/MsgCreateGroup',
      value: {
        admin,
        members: members.map(d => d.toAmino()),
        metadata,
      },
    };
  }

  public static fromData(data: MsgCreateGroup.Data): MsgCreateGroup {
    const { admin, members, metadata } = data;
    return new MsgCreateGroup(
      admin,
      members.map(MemberRequest.fromData),
      metadata
    );
  }

  public toData(): MsgCreateGroup.Data {
    const { admin, members, metadata } = this;
    return {
      '@type': '/cosmos.group.v1.MsgCreateGroup',
      admin,
      members: members.map(d => d.toData()),
      metadata,
    };
  }

  public static fromProto(data: MsgCreateGroup.Proto): MsgCreateGroup {
    return new MsgCreateGroup(
      data.admin,
      data.members.map(MemberRequest.fromProto),
      data.metadata
    );
  }

  public toProto(): MsgCreateGroup.Proto {
    const { admin, members, metadata } = this;
    return MsgCreateGroup_pb.fromPartial({
      admin,
      members: members.map(d => d.toProto()),
      metadata,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.group.v1.MsgCreateGroup',
      value: MsgCreateGroup_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgCreateGroup {
    return MsgCreateGroup.fromProto(MsgCreateGroup_pb.decode(msgAny.value));
  }
}

export namespace MsgCreateGroup {
  export interface Amino {
    type: 'cosmos-sdk/MsgCreateGroup';
    value: {
      admin: AccAddress;
      members: MemberRequest.Amino[];
      metadata: string;
    };
  }

  export interface Data {
    '@type': '/cosmos.group.v1.MsgCreateGroup';
    admin: AccAddress;
    members: MemberRequest.Data[];
    metadata: string;
  }

  export type Proto = MsgCreateGroup_pb;
}
