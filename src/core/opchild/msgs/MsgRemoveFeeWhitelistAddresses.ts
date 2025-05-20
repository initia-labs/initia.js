import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgRemoveFeeWhitelistAddresses as MsgRemoveFeeWhitelistAddresses_pb } from '@initia/opinit.proto/opinit/opchild/v1/tx'

/**
 * MsgRemoveFeeWhitelistAddresses is a message to remove addresses to the x/opchild fee whitelist.
 */
export class MsgRemoveFeeWhitelistAddresses extends JSONSerializable<
  MsgRemoveFeeWhitelistAddresses.Amino,
  MsgRemoveFeeWhitelistAddresses.Data,
  MsgRemoveFeeWhitelistAddresses.Proto
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
    data: MsgRemoveFeeWhitelistAddresses.Amino
  ): MsgRemoveFeeWhitelistAddresses {
    const {
      value: { authority, addresses },
    } = data
    return new MsgRemoveFeeWhitelistAddresses(authority, addresses)
  }

  public toAmino(): MsgRemoveFeeWhitelistAddresses.Amino {
    const { authority, addresses } = this
    return {
      type: 'opchild/MsgRemoveFeeWhitelistAddresses',
      value: {
        authority,
        addresses,
      },
    }
  }

  public static fromData(
    data: MsgRemoveFeeWhitelistAddresses.Data
  ): MsgRemoveFeeWhitelistAddresses {
    const { authority, addresses } = data
    return new MsgRemoveFeeWhitelistAddresses(authority, addresses)
  }

  public toData(): MsgRemoveFeeWhitelistAddresses.Data {
    const { authority, addresses } = this
    return {
      '@type': '/opinit.opchild.v1.MsgRemoveFeeWhitelistAddresses',
      authority,
      addresses,
    }
  }

  public static fromProto(
    data: MsgRemoveFeeWhitelistAddresses.Proto
  ): MsgRemoveFeeWhitelistAddresses {
    return new MsgRemoveFeeWhitelistAddresses(data.authority, data.addresses)
  }

  public toProto(): MsgRemoveFeeWhitelistAddresses.Proto {
    const { authority, addresses } = this
    return MsgRemoveFeeWhitelistAddresses_pb.fromPartial({
      authority,
      addresses,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.opchild.v1.MsgRemoveFeeWhitelistAddresses',
      value: MsgRemoveFeeWhitelistAddresses_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgRemoveFeeWhitelistAddresses {
    return MsgRemoveFeeWhitelistAddresses.fromProto(
      MsgRemoveFeeWhitelistAddresses_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgRemoveFeeWhitelistAddresses {
  export interface Amino {
    type: 'opchild/MsgRemoveFeeWhitelistAddresses'
    value: {
      authority: AccAddress
      addresses: AccAddress[]
    }
  }

  export interface Data {
    '@type': '/opinit.opchild.v1.MsgRemoveFeeWhitelistAddresses'
    authority: AccAddress
    addresses: AccAddress[]
  }

  export type Proto = MsgRemoveFeeWhitelistAddresses_pb
}
