import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgAddFeeWhitelistAddresses as MsgAddFeeWhitelistAddresses_pb } from '@initia/opinit.proto/opinit/opchild/v1/tx'

/**
 * MsgAddFeeWhitelistAddresses is a message to add addresses to the x/opchild fee whitelist.
 */
export class MsgAddFeeWhitelistAddresses extends JSONSerializable<
  MsgAddFeeWhitelistAddresses.Amino,
  MsgAddFeeWhitelistAddresses.Data,
  MsgAddFeeWhitelistAddresses.Proto
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
    data: MsgAddFeeWhitelistAddresses.Amino
  ): MsgAddFeeWhitelistAddresses {
    const {
      value: { authority, addresses },
    } = data
    return new MsgAddFeeWhitelistAddresses(authority, addresses)
  }

  public toAmino(): MsgAddFeeWhitelistAddresses.Amino {
    const { authority, addresses } = this
    return {
      type: 'opchild/MsgAddFeeWhitelistAddresses',
      value: {
        authority,
        addresses,
      },
    }
  }

  public static fromData(
    data: MsgAddFeeWhitelistAddresses.Data
  ): MsgAddFeeWhitelistAddresses {
    const { authority, addresses } = data
    return new MsgAddFeeWhitelistAddresses(authority, addresses)
  }

  public toData(): MsgAddFeeWhitelistAddresses.Data {
    const { authority, addresses } = this
    return {
      '@type': '/opinit.opchild.v1.MsgAddFeeWhitelistAddresses',
      authority,
      addresses,
    }
  }

  public static fromProto(
    data: MsgAddFeeWhitelistAddresses.Proto
  ): MsgAddFeeWhitelistAddresses {
    return new MsgAddFeeWhitelistAddresses(data.authority, data.addresses)
  }

  public toProto(): MsgAddFeeWhitelistAddresses.Proto {
    const { authority, addresses } = this
    return MsgAddFeeWhitelistAddresses_pb.fromPartial({
      authority,
      addresses,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.opchild.v1.MsgAddFeeWhitelistAddresses',
      value: MsgAddFeeWhitelistAddresses_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgAddFeeWhitelistAddresses {
    return MsgAddFeeWhitelistAddresses.fromProto(
      MsgAddFeeWhitelistAddresses_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgAddFeeWhitelistAddresses {
  export interface Amino {
    type: 'opchild/MsgAddFeeWhitelistAddresses'
    value: {
      authority: AccAddress
      addresses: AccAddress[]
    }
  }

  export interface Data {
    '@type': '/opinit.opchild.v1.MsgAddFeeWhitelistAddresses'
    authority: AccAddress
    addresses: AccAddress[]
  }

  export type Proto = MsgAddFeeWhitelistAddresses_pb
}
