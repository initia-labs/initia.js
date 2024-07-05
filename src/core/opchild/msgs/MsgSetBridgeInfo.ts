import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { BridgeInfo } from '../BridgeInfo'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgSetBridgeInfo as MsgSetBridgeInfo_pb } from '@initia/opinit.proto/opinit/opchild/v1/tx'

export class MsgSetBridgeInfo extends JSONSerializable<
  MsgSetBridgeInfo.Amino,
  MsgSetBridgeInfo.Data,
  MsgSetBridgeInfo.Proto
> {
  /**
   * @param sender the sender address
   * @param bridge_info the bridge information to be set
   */
  constructor(
    public sender: AccAddress,
    public bridge_info: BridgeInfo
  ) {
    super()
  }

  public static fromAmino(data: MsgSetBridgeInfo.Amino): MsgSetBridgeInfo {
    const {
      value: { sender, bridge_info },
    } = data
    return new MsgSetBridgeInfo(sender, BridgeInfo.fromAmino(bridge_info))
  }

  public toAmino(): MsgSetBridgeInfo.Amino {
    const { sender, bridge_info } = this
    return {
      type: 'opchild/MsgSetBridgeInfo',
      value: {
        sender,
        bridge_info: bridge_info.toAmino(),
      },
    }
  }

  public static fromData(data: MsgSetBridgeInfo.Data): MsgSetBridgeInfo {
    const { sender, bridge_info } = data
    return new MsgSetBridgeInfo(sender, BridgeInfo.fromData(bridge_info))
  }

  public toData(): MsgSetBridgeInfo.Data {
    const { sender, bridge_info } = this
    return {
      '@type': '/opinit.opchild.v1.MsgSetBridgeInfo',
      sender,
      bridge_info: bridge_info.toData(),
    }
  }

  public static fromProto(data: MsgSetBridgeInfo.Proto): MsgSetBridgeInfo {
    return new MsgSetBridgeInfo(
      data.sender,
      BridgeInfo.fromProto(data.bridgeInfo as BridgeInfo.Proto)
    )
  }

  public toProto(): MsgSetBridgeInfo.Proto {
    const { sender, bridge_info } = this
    return MsgSetBridgeInfo_pb.fromPartial({
      sender,
      bridgeInfo: bridge_info.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.opchild.v1.MsgSetBridgeInfo',
      value: MsgSetBridgeInfo_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgSetBridgeInfo {
    return MsgSetBridgeInfo.fromProto(MsgSetBridgeInfo_pb.decode(msgAny.value))
  }
}

export namespace MsgSetBridgeInfo {
  export interface Amino {
    type: 'opchild/MsgSetBridgeInfo'
    value: {
      sender: AccAddress
      bridge_info: BridgeInfo.Amino
    }
  }

  export interface Data {
    '@type': '/opinit.opchild.v1.MsgSetBridgeInfo'
    sender: AccAddress
    bridge_info: BridgeInfo.Data
  }

  export type Proto = MsgSetBridgeInfo_pb
}
