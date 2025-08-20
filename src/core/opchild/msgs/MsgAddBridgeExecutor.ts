import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgAddBridgeExecutor as MsgAddBridgeExecutor_pb } from '@initia/opinit.proto/opinit/opchild/v1/tx'

/**
 * MsgAddBridgeExecutor is a message to add addresses to the x/opchild bridge executors.
 */
export class MsgAddBridgeExecutor extends JSONSerializable<
  MsgAddBridgeExecutor.Amino,
  MsgAddBridgeExecutor.Data,
  MsgAddBridgeExecutor.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param addresses
   */
  constructor(
    public authority: AccAddress,
    public addresses: AccAddress[]
  ) {
    super()
  }

  public static fromAmino(
    data: MsgAddBridgeExecutor.Amino
  ): MsgAddBridgeExecutor {
    const {
      value: { authority, addresses },
    } = data
    return new MsgAddBridgeExecutor(authority, addresses)
  }

  public toAmino(): MsgAddBridgeExecutor.Amino {
    const { authority, addresses } = this
    return {
      type: 'opchild/MsgAddBridgeExecutor',
      value: {
        authority,
        addresses,
      },
    }
  }

  public static fromData(
    data: MsgAddBridgeExecutor.Data
  ): MsgAddBridgeExecutor {
    const { authority, addresses } = data
    return new MsgAddBridgeExecutor(authority, addresses)
  }

  public toData(): MsgAddBridgeExecutor.Data {
    const { authority, addresses } = this
    return {
      '@type': '/opinit.opchild.v1.MsgAddBridgeExecutor',
      authority,
      addresses,
    }
  }

  public static fromProto(
    data: MsgAddBridgeExecutor.Proto
  ): MsgAddBridgeExecutor {
    return new MsgAddBridgeExecutor(data.authority, data.addresses)
  }

  public toProto(): MsgAddBridgeExecutor.Proto {
    const { authority, addresses } = this
    return MsgAddBridgeExecutor_pb.fromPartial({
      authority,
      addresses,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.opchild.v1.MsgAddBridgeExecutor',
      value: MsgAddBridgeExecutor_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgAddBridgeExecutor {
    return MsgAddBridgeExecutor.fromProto(
      MsgAddBridgeExecutor_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgAddBridgeExecutor {
  export interface Amino {
    type: 'opchild/MsgAddBridgeExecutor'
    value: {
      authority: AccAddress
      addresses: AccAddress[]
    }
  }

  export interface Data {
    '@type': '/opinit.opchild.v1.MsgAddBridgeExecutor'
    authority: AccAddress
    addresses: AccAddress[]
  }

  export type Proto = MsgAddBridgeExecutor_pb
}
