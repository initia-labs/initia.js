import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgRemoveMarketAuthorities as MsgRemoveMarketAuthorities_pb } from '@initia/initia.proto/slinky/marketmap/v1/tx'

export class MsgRemoveMarketAuthorities extends JSONSerializable<
  MsgRemoveMarketAuthorities.Amino,
  MsgRemoveMarketAuthorities.Data,
  MsgRemoveMarketAuthorities.Proto
> {
  /**
   * @param remove_addresses the list of addresses to remove
   * @param admin the authority that is the x/marketmap Admin account
   */
  constructor(
    public remove_addresses: AccAddress[],
    public admin: AccAddress
  ) {
    super()
  }

  public static fromAmino(
    data: MsgRemoveMarketAuthorities.Amino
  ): MsgRemoveMarketAuthorities {
    const {
      value: { remove_addresses, admin },
    } = data
    return new MsgRemoveMarketAuthorities(remove_addresses, admin)
  }

  public toAmino(): MsgRemoveMarketAuthorities.Amino {
    const { remove_addresses, admin } = this
    return {
      type: 'slinky/x/marketmap/MsgRemoveMarketAuthorities',
      value: {
        remove_addresses,
        admin,
      },
    }
  }

  public static fromData(
    data: MsgRemoveMarketAuthorities.Data
  ): MsgRemoveMarketAuthorities {
    const { remove_addresses, admin } = data
    return new MsgRemoveMarketAuthorities(remove_addresses, admin)
  }

  public toData(): MsgRemoveMarketAuthorities.Data {
    const { remove_addresses, admin } = this
    return {
      '@type': '/slinky.marketmap.v1.MsgRemoveMarketAuthorities',
      remove_addresses,
      admin,
    }
  }

  public static fromProto(
    data: MsgRemoveMarketAuthorities.Proto
  ): MsgRemoveMarketAuthorities {
    return new MsgRemoveMarketAuthorities(data.removeAddresses, data.admin)
  }

  public toProto(): MsgRemoveMarketAuthorities.Proto {
    const { remove_addresses, admin } = this
    return MsgRemoveMarketAuthorities_pb.fromPartial({
      removeAddresses: remove_addresses,
      admin,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/slinky.marketmap.v1.MsgRemoveMarketAuthorities',
      value: MsgRemoveMarketAuthorities_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgRemoveMarketAuthorities {
    return MsgRemoveMarketAuthorities.fromProto(
      MsgRemoveMarketAuthorities_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgRemoveMarketAuthorities {
  export interface Amino {
    type: 'slinky/x/marketmap/MsgRemoveMarketAuthorities'
    value: {
      remove_addresses: AccAddress[]
      admin: AccAddress
    }
  }

  export interface Data {
    '@type': '/slinky.marketmap.v1.MsgRemoveMarketAuthorities'
    remove_addresses: AccAddress[]
    admin: AccAddress
  }

  export type Proto = MsgRemoveMarketAuthorities_pb
}
