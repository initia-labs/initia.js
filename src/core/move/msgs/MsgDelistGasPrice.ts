import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgDelistGasPrice as MsgDelistGasPrice_pb } from '@initia/initia.proto/initia/move/v1/tx'

/**
 * MsgDelistGasPrice removes a DEX pair from the gas price whitelist.
 */
export class MsgDelistGasPrice extends JSONSerializable<
  MsgDelistGasPrice.Amino,
  MsgDelistGasPrice.Data,
  MsgDelistGasPrice.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param metadata_quote the metadata address of the token to whitelist as a gas token
   * @param metadata_lp the LP metadata address of the DEX pair
   */
  constructor(
    public authority: AccAddress,
    public metadata_quote: string,
    public metadata_lp: string
  ) {
    super()
  }

  public static fromAmino(data: MsgDelistGasPrice.Amino): MsgDelistGasPrice {
    const {
      value: { authority, metadata_quote, metadata_lp },
    } = data

    return new MsgDelistGasPrice(authority, metadata_quote, metadata_lp)
  }

  public toAmino(): MsgDelistGasPrice.Amino {
    const { authority, metadata_quote, metadata_lp } = this

    return {
      type: 'move/MsgDelistGasPrice',
      value: {
        authority,
        metadata_quote,
        metadata_lp,
      },
    }
  }

  public static fromData(data: MsgDelistGasPrice.Data): MsgDelistGasPrice {
    const { authority, metadata_quote, metadata_lp } = data

    return new MsgDelistGasPrice(authority, metadata_quote, metadata_lp)
  }

  public toData(): MsgDelistGasPrice.Data {
    const { authority, metadata_quote, metadata_lp } = this

    return {
      '@type': '/initia.move.v1.MsgDelistGasPrice',
      authority,
      metadata_quote,
      metadata_lp,
    }
  }

  public static fromProto(data: MsgDelistGasPrice.Proto): MsgDelistGasPrice {
    return new MsgDelistGasPrice(
      data.authority,
      data.metadataQuote,
      data.metadataLp
    )
  }

  public toProto(): MsgDelistGasPrice.Proto {
    const { authority, metadata_quote, metadata_lp } = this

    return MsgDelistGasPrice_pb.fromPartial({
      authority,
      metadataQuote: metadata_quote,
      metadataLp: metadata_lp,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.MsgDelistGasPrice',
      value: MsgDelistGasPrice_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgDelistGasPrice {
    return MsgDelistGasPrice.fromProto(
      MsgDelistGasPrice_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgDelistGasPrice {
  export interface Amino {
    type: 'move/MsgDelistGasPrice'
    value: {
      authority: AccAddress
      metadata_quote: string
      metadata_lp: string
    }
  }

  export interface Data {
    '@type': '/initia.move.v1.MsgDelistGasPrice'
    authority: AccAddress
    metadata_quote: string
    metadata_lp: string
  }

  export type Proto = MsgDelistGasPrice_pb
}
