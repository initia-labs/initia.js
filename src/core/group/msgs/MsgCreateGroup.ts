import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MemberRequest } from '@initia/initia.proto/cosmos/group/v1/types';
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
    return new MsgCreateGroup(admin, members, metadata);
  }

  public toAmino(): MsgCreateGroup.Amino {
    const { admin, members, metadata } = this;
    return {
      type: 'cosmos-sdk/MsgCreateGroup',
      value: {
        admin,
        members,
        metadata,
      },
    };
  }

  public static fromData(data: MsgCreateGroup.Data): MsgCreateGroup {
    const { admin, members, metadata } = data;
    return new MsgCreateGroup(admin, members, metadata);
  }

  public toData(): MsgCreateGroup.Data {
    const { admin, members, metadata } = this;
    return {
      '@type': '/cosmos.group.v1.MsgCreateGroup',
      admin,
      members,
      metadata,
    };
  }

  public static fromProto(data: MsgCreateGroup.Proto): MsgCreateGroup {
    return new MsgCreateGroup(data.admin, data.members, data.metadata);
  }

  public toProto(): MsgCreateGroup.Proto {
    const { admin, members, metadata } = this;
    return MsgCreateGroup_pb.fromPartial({
      admin,
      members,
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
      members: MemberRequest[];
      metadata: string;
    };
  }

  export interface Data {
    '@type': '/cosmos.group.v1.MsgCreateGroup';
    admin: AccAddress;
    members: MemberRequest[];
    metadata: string;
  }

  export type Proto = MsgCreateGroup_pb;
}
