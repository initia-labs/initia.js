import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { MsgDisableBridge as MsgDisableBridge_pb } from '@initia/opinit.proto/opinit/ophost/v1/tx'
import { Any } from '@initia/initia.proto/google/protobuf/any'

/**
 * MsgDisableBridge is a message to disable the bridge.
 */
export class MsgDisableBridge extends JSONSerializable<
  MsgDisableBridge.Amino,
  MsgDisableBridge.Data,
  MsgDisableBridge.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param bridge_id
   */
  constructor(
    public authority: AccAddress,
    public bridge_id: number
  ) {
    super()
  }

  public static fromAmino(data: MsgDisableBridge.Amino): MsgDisableBridge {
    const {
      value: { authority, bridge_id },
    } = data

    return new MsgDisableBridge(authority, parseInt(bridge_id))
  }

  public toAmino(): MsgDisableBridge.Amino {
    const { authority, bridge_id } = this
    return {
      type: 'ophost/MsgDisableBridge',
      value: {
        authority,
        bridge_id: bridge_id.toFixed(),
      },
    }
  }

  public static fromData(data: MsgDisableBridge.Data): MsgDisableBridge {
    const { authority, bridge_id } = data
    return new MsgDisableBridge(authority, parseInt(bridge_id))
  }

  public toData(): MsgDisableBridge.Data {
    const { authority, bridge_id } = this
    return {
      '@type': '/opinit.ophost.v1.MsgDisableBridge',
      authority,
      bridge_id: bridge_id.toFixed(),
    }
  }

  public static fromProto(data: MsgDisableBridge.Proto): MsgDisableBridge {
    return new MsgDisableBridge(data.authority, Number(data.bridgeId))
  }

  public toProto(): MsgDisableBridge.Proto {
    const { authority, bridge_id } = this
    return MsgDisableBridge_pb.fromPartial({
      authority,
      bridgeId: BigInt(bridge_id),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.ophost.v1.MsgDisableBridge',
      value: MsgDisableBridge_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgDisableBridge {
    return MsgDisableBridge.fromProto(MsgDisableBridge_pb.decode(msgAny.value))
  }
}

export namespace MsgDisableBridge {
  export interface Amino {
    type: 'ophost/MsgDisableBridge'
    value: {
      authority: AccAddress
      bridge_id: string
    }
  }

  export interface Data {
    '@type': '/opinit.ophost.v1.MsgDisableBridge'
    authority: AccAddress
    bridge_id: string
  }

  export type Proto = MsgDisableBridge_pb
}
