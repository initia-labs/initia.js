import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUpdateGroupMetadata as MsgUpdateGroupMetadata_pb } from '@initia/initia.proto/cosmos/group/v1/tx'

/**
 * MsgUpdateGroupMetadata updates the group metadata with given group id and admin address.
 */
export class MsgUpdateGroupMetadata extends JSONSerializable<
  MsgUpdateGroupMetadata.Amino,
  MsgUpdateGroupMetadata.Data,
  MsgUpdateGroupMetadata.Proto
> {
  /**
   * @param admin the account address of the group admin
   * @param group_id the unique ID of the group
   * @param metadata the updated group's metadata
   */
  constructor(
    public admin: AccAddress,
    public group_id: number,
    public metadata: string
  ) {
    super()
  }

  public static fromAmino(
    data: MsgUpdateGroupMetadata.Amino
  ): MsgUpdateGroupMetadata {
    const {
      value: { admin, group_id, metadata },
    } = data
    return new MsgUpdateGroupMetadata(admin, parseInt(group_id), metadata)
  }

  public toAmino(): MsgUpdateGroupMetadata.Amino {
    const { admin, group_id, metadata } = this
    return {
      type: 'cosmos-sdk/MsgUpdateGroupMetadata',
      value: {
        admin,
        group_id: group_id.toFixed(),
        metadata,
      },
    }
  }

  public static fromData(
    data: MsgUpdateGroupMetadata.Data
  ): MsgUpdateGroupMetadata {
    const { admin, group_id, metadata } = data
    return new MsgUpdateGroupMetadata(admin, parseInt(group_id), metadata)
  }

  public toData(): MsgUpdateGroupMetadata.Data {
    const { admin, group_id, metadata } = this
    return {
      '@type': '/cosmos.group.v1.MsgUpdateGroupMetadata',
      admin,
      group_id: group_id.toFixed(),
      metadata,
    }
  }

  public static fromProto(
    data: MsgUpdateGroupMetadata.Proto
  ): MsgUpdateGroupMetadata {
    return new MsgUpdateGroupMetadata(
      data.admin,
      Number(data.groupId),
      data.metadata
    )
  }

  public toProto(): MsgUpdateGroupMetadata.Proto {
    const { admin, group_id, metadata } = this
    return MsgUpdateGroupMetadata_pb.fromPartial({
      admin,
      groupId: BigInt(group_id),
      metadata,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.group.v1.MsgUpdateGroupMetadata',
      value: MsgUpdateGroupMetadata_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateGroupMetadata {
    return MsgUpdateGroupMetadata.fromProto(
      MsgUpdateGroupMetadata_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateGroupMetadata {
  export interface Amino {
    type: 'cosmos-sdk/MsgUpdateGroupMetadata'
    value: {
      admin: AccAddress
      group_id: string
      metadata: string
    }
  }

  export interface Data {
    '@type': '/cosmos.group.v1.MsgUpdateGroupMetadata'
    admin: AccAddress
    group_id: string
    metadata: string
  }

  export type Proto = MsgUpdateGroupMetadata_pb
}
