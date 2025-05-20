import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgRemoveBridgeExecutor as MsgRemoveBridgeExecutor_pb } from '@initia/opinit.proto/opinit/opchild/v1/tx'

/**
 * MsgRemoveBridgeExecutor is a message to remove addresses from the x/opchild bridge executors.
 */
export class MsgRemoveBridgeExecutor extends JSONSerializable<
  MsgRemoveBridgeExecutor.Amino,
  MsgRemoveBridgeExecutor.Data,
  MsgRemoveBridgeExecutor.Proto
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
    data: MsgRemoveBridgeExecutor.Amino
  ): MsgRemoveBridgeExecutor {
    const {
      value: { authority, addresses },
    } = data
    return new MsgRemoveBridgeExecutor(authority, addresses)
  }

  public toAmino(): MsgRemoveBridgeExecutor.Amino {
    const { authority, addresses } = this
    return {
      type: 'opchild/MsgRemoveBridgeExecutor',
      value: {
        authority,
        addresses,
      },
    }
  }

  public static fromData(
    data: MsgRemoveBridgeExecutor.Data
  ): MsgRemoveBridgeExecutor {
    const { authority, addresses } = data
    return new MsgRemoveBridgeExecutor(authority, addresses)
  }

  public toData(): MsgRemoveBridgeExecutor.Data {
    const { authority, addresses } = this
    return {
      '@type': '/opinit.opchild.v1.MsgRemoveBridgeExecutor',
      authority,
      addresses,
    }
  }

  public static fromProto(
    data: MsgRemoveBridgeExecutor.Proto
  ): MsgRemoveBridgeExecutor {
    return new MsgRemoveBridgeExecutor(data.authority, data.addresses)
  }

  public toProto(): MsgRemoveBridgeExecutor.Proto {
    const { authority, addresses } = this
    return MsgRemoveBridgeExecutor_pb.fromPartial({
      authority,
      addresses,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.opchild.v1.MsgRemoveBridgeExecutor',
      value: MsgRemoveBridgeExecutor_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgRemoveBridgeExecutor {
    return MsgRemoveBridgeExecutor.fromProto(
      MsgRemoveBridgeExecutor_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgRemoveBridgeExecutor {
  export interface Amino {
    type: 'opchild/MsgRemoveBridgeExecutor'
    value: {
      authority: AccAddress
      addresses: AccAddress[]
    }
  }

  export interface Data {
    '@type': '/opinit.opchild.v1.MsgRemoveBridgeExecutor'
    authority: AccAddress
    addresses: AccAddress[]
  }

  export type Proto = MsgRemoveBridgeExecutor_pb
}
