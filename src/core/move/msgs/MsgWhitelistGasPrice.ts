import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgWhitelistGasPrice as MsgWhitelistGasPrice_pb } from '@initia/initia.proto/initia/move/v1/tx'

/**
 * MsgWhitelistGasPrice registers a DEX pair in the gas price whitelist.
 * This allows the counterparty denom to be used as gas fee.
 */
export class MsgWhitelistGasPrice extends JSONSerializable<
  MsgWhitelistGasPrice.Amino,
  MsgWhitelistGasPrice.Data,
  MsgWhitelistGasPrice.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param metadata_lp dex coin LP metadata address
   * @param metadata_quote registered to distribution's Params
   */
  constructor(
    public authority: AccAddress,
    public metadata_quote: string,
    public metadata_lp: string
  ) {
    super()
  }

  public static fromAmino(
    data: MsgWhitelistGasPrice.Amino
  ): MsgWhitelistGasPrice {
    const {
      value: { authority, metadata_lp, metadata_quote },
    } = data

    return new MsgWhitelistGasPrice(authority, metadata_quote, metadata_lp)
  }

  public toAmino(): MsgWhitelistGasPrice.Amino {
    const { authority, metadata_lp, metadata_quote } = this

    return {
      type: 'move/MsgWhitelistGasPrice',
      value: {
        authority,
        metadata_quote,
        metadata_lp,
      },
    }
  }

  public static fromData(
    data: MsgWhitelistGasPrice.Data
  ): MsgWhitelistGasPrice {
    const { authority, metadata_quote, metadata_lp } = data

    return new MsgWhitelistGasPrice(authority, metadata_quote, metadata_lp)
  }

  public toData(): MsgWhitelistGasPrice.Data {
    const { authority, metadata_quote, metadata_lp } = this

    return {
      '@type': '/initia.move.v1.MsgWhitelistGasPrice',
      authority,
      metadata_quote,
      metadata_lp,
    }
  }

  public static fromProto(
    data: MsgWhitelistGasPrice.Proto
  ): MsgWhitelistGasPrice {
    return new MsgWhitelistGasPrice(
      data.authority,
      data.metadataQuote,
      data.metadataLp
    )
  }

  public toProto(): MsgWhitelistGasPrice.Proto {
    const { authority, metadata_lp, metadata_quote } = this

    return MsgWhitelistGasPrice_pb.fromPartial({
      authority,
      metadataQuote: metadata_quote,
      metadataLp: metadata_lp,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.MsgWhitelistGasPrice',
      value: MsgWhitelistGasPrice_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgWhitelistGasPrice {
    return MsgWhitelistGasPrice.fromProto(
      MsgWhitelistGasPrice_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgWhitelistGasPrice {
  export interface Amino {
    type: 'move/MsgWhitelistGasPrice'
    value: {
      authority: AccAddress
      metadata_quote: string
      metadata_lp: string
    }
  }

  export interface Data {
    '@type': '/initia.move.v1.MsgWhitelistGasPrice'
    authority: AccAddress
    metadata_quote: string
    metadata_lp: string
  }

  export type Proto = MsgWhitelistGasPrice_pb
}
