import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgLeaveGroup as MsgLeaveGroup_pb } from '@initia/initia.proto/cosmos/group/v1/tx'

/**
 * MsgLeaveGroup allows a group member to leave the group.
 */
export class MsgLeaveGroup extends JSONSerializable<
  MsgLeaveGroup.Amino,
  MsgLeaveGroup.Data,
  MsgLeaveGroup.Proto
> {
  /**
   * @param address the account address of the group member
   * @param group_id the unique ID of the group
   */
  constructor(
    public address: AccAddress,
    public group_id: number
  ) {
    super()
  }

  public static fromAmino(data: MsgLeaveGroup.Amino): MsgLeaveGroup {
    const {
      value: { address, group_id },
    } = data
    return new MsgLeaveGroup(address, parseInt(group_id))
  }

  public toAmino(): MsgLeaveGroup.Amino {
    const { address, group_id } = this
    return {
      type: 'cosmos-sdk/group/MsgLeaveGroup',
      value: {
        address,
        group_id: group_id.toFixed(),
      },
    }
  }

  public static fromData(data: MsgLeaveGroup.Data): MsgLeaveGroup {
    const { address, group_id } = data
    return new MsgLeaveGroup(address, parseInt(group_id))
  }

  public toData(): MsgLeaveGroup.Data {
    const { address, group_id } = this
    return {
      '@type': '/cosmos.group.v1.MsgLeaveGroup',
      address,
      group_id: group_id.toFixed(),
    }
  }

  public static fromProto(data: MsgLeaveGroup.Proto): MsgLeaveGroup {
    return new MsgLeaveGroup(data.address, data.groupId.toNumber())
  }

  public toProto(): MsgLeaveGroup.Proto {
    const { address, group_id } = this
    return MsgLeaveGroup_pb.fromPartial({
      address,
      groupId: group_id,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.group.v1.MsgLeaveGroup',
      value: MsgLeaveGroup_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgLeaveGroup {
    return MsgLeaveGroup.fromProto(MsgLeaveGroup_pb.decode(msgAny.value))
  }
}

export namespace MsgLeaveGroup {
  export interface Amino {
    type: 'cosmos-sdk/group/MsgLeaveGroup'
    value: {
      address: AccAddress
      group_id: string
    }
  }

  export interface Data {
    '@type': '/cosmos.group.v1.MsgLeaveGroup'
    address: AccAddress
    group_id: string
  }

  export type Proto = MsgLeaveGroup_pb
}
