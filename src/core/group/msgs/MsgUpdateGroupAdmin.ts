import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgUpdateGroupAdmin as MsgUpdateGroupAdmin_pb } from '@initia/initia.proto/cosmos/group/v1/tx';
import Long from 'long';

export class MsgUpdateGroupAdmin extends JSONSerializable<
  MsgUpdateGroupAdmin.Amino,
  MsgUpdateGroupAdmin.Data,
  MsgUpdateGroupAdmin.Proto
> {
  /**
   * @param admin the current account address of the group admin
   * @param group_id the unique ID of the group
   * @param new_admin the group new admin account address
   */
  constructor(
    public admin: AccAddress,
    public group_id: number,
    public new_admin: AccAddress
  ) {
    super();
  }

  public static fromAmino(
    data: MsgUpdateGroupAdmin.Amino
  ): MsgUpdateGroupAdmin {
    const {
      value: { admin, group_id, new_admin },
    } = data;
    return new MsgUpdateGroupAdmin(admin, Number.parseInt(group_id), new_admin);
  }

  public toAmino(): MsgUpdateGroupAdmin.Amino {
    const { admin, group_id, new_admin } = this;
    return {
      type: 'cosmos-sdk/MsgUpdateGroupAdmin',
      value: {
        admin,
        group_id: group_id.toString(),
        new_admin,
      },
    };
  }

  public static fromData(data: MsgUpdateGroupAdmin.Data): MsgUpdateGroupAdmin {
    const { admin, group_id, new_admin } = data;
    return new MsgUpdateGroupAdmin(admin, Number.parseInt(group_id), new_admin);
  }

  public toData(): MsgUpdateGroupAdmin.Data {
    const { admin, group_id, new_admin } = this;
    return {
      '@type': '/cosmos.group.v1.MsgUpdateGroupAdmin',
      admin,
      group_id: group_id.toString(),
      new_admin,
    };
  }

  public static fromProto(
    data: MsgUpdateGroupAdmin.Proto
  ): MsgUpdateGroupAdmin {
    return new MsgUpdateGroupAdmin(
      data.admin,
      data.groupId.toNumber(),
      data.newAdmin
    );
  }

  public toProto(): MsgUpdateGroupAdmin.Proto {
    const { admin, group_id, new_admin } = this;
    return MsgUpdateGroupAdmin_pb.fromPartial({
      admin,
      groupId: Long.fromNumber(group_id),
      newAdmin: new_admin,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.group.v1.MsgUpdateGroupAdmin',
      value: MsgUpdateGroupAdmin_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgUpdateGroupAdmin {
    return MsgUpdateGroupAdmin.fromProto(
      MsgUpdateGroupAdmin_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgUpdateGroupAdmin {
  export interface Amino {
    type: 'cosmos-sdk/MsgUpdateGroupAdmin';
    value: {
      admin: AccAddress;
      group_id: string;
      new_admin: AccAddress;
    };
  }

  export interface Data {
    '@type': '/cosmos.group.v1.MsgUpdateGroupAdmin';
    admin: AccAddress;
    group_id: string;
    new_admin: AccAddress;
  }

  export type Proto = MsgUpdateGroupAdmin_pb;
}
