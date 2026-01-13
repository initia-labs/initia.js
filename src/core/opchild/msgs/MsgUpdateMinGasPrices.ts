import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Coins } from '../../Coins'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUpdateMinGasPrices as MsgUpdateMinGasPrices_pb } from '@initia/opinit.proto/opinit/opchild/v1/tx'

/**
 * MsgUpdateMinGasPrices is a message to update the min gas prices parameter.
 */
export class MsgUpdateMinGasPrices extends JSONSerializable<
  MsgUpdateMinGasPrices.Amino,
  MsgUpdateMinGasPrices.Data,
  MsgUpdateMinGasPrices.Proto
> {
  public min_gas_prices: Coins

  /**
   * @param authority the address that controls the module
   * @param min_gas_prices
   */
  constructor(
    public authority: AccAddress,
    min_gas_prices: Coins.Input
  ) {
    super()
    this.min_gas_prices = new Coins(min_gas_prices)
  }

  public static fromAmino(
    data: MsgUpdateMinGasPrices.Amino
  ): MsgUpdateMinGasPrices {
    const {
      value: { authority, min_gas_prices },
    } = data
    return new MsgUpdateMinGasPrices(authority, Coins.fromAmino(min_gas_prices))
  }

  public toAmino(): MsgUpdateMinGasPrices.Amino {
    const { authority, min_gas_prices } = this
    return {
      type: 'opchild/MsgUpdateMinGasPrices',
      value: {
        authority,
        min_gas_prices: min_gas_prices.toAmino(),
      },
    }
  }

  public static fromData(
    data: MsgUpdateMinGasPrices.Data
  ): MsgUpdateMinGasPrices {
    const { authority, min_gas_prices } = data
    return new MsgUpdateMinGasPrices(authority, Coins.fromData(min_gas_prices))
  }

  public toData(): MsgUpdateMinGasPrices.Data {
    const { authority, min_gas_prices } = this
    return {
      '@type': '/opinit.opchild.v1.MsgUpdateMinGasPrices',
      authority,
      min_gas_prices: min_gas_prices.toData(),
    }
  }

  public static fromProto(
    data: MsgUpdateMinGasPrices.Proto
  ): MsgUpdateMinGasPrices {
    return new MsgUpdateMinGasPrices(
      data.authority,
      Coins.fromProtoDec(data.minGasPrices)
    )
  }

  public toProto(): MsgUpdateMinGasPrices.Proto {
    const { authority, min_gas_prices } = this
    return MsgUpdateMinGasPrices_pb.fromPartial({
      authority,
      minGasPrices: min_gas_prices.toProtoDec(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.opchild.v1.MsgUpdateMinGasPrices',
      value: MsgUpdateMinGasPrices_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateMinGasPrices {
    return MsgUpdateMinGasPrices.fromProto(
      MsgUpdateMinGasPrices_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateMinGasPrices {
  export interface Amino {
    type: 'opchild/MsgUpdateMinGasPrices'
    value: {
      authority: AccAddress
      min_gas_prices: Coins.Amino
    }
  }

  export interface Data {
    '@type': '/opinit.opchild.v1.MsgUpdateMinGasPrices'
    authority: AccAddress
    min_gas_prices: Coins.Data
  }

  export type Proto = MsgUpdateMinGasPrices_pb
}
