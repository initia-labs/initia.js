import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { AuctionParams } from '../AuctionParams'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUpdateParams as MsgUpdateParams_pb } from '@initia/initia.proto/sdk/auction/v1/tx'

export class MsgUpdateAuctionParams extends JSONSerializable<
  MsgUpdateAuctionParams.Amino,
  MsgUpdateAuctionParams.Data,
  MsgUpdateAuctionParams.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param params params defines the x/auth parameters to update
   */
  constructor(
    public authority: AccAddress,
    public params: AuctionParams
  ) {
    super()
  }

  public static fromAmino(
    data: MsgUpdateAuctionParams.Amino
  ): MsgUpdateAuctionParams {
    const {
      value: { authority, params },
    } = data
    return new MsgUpdateAuctionParams(
      authority,
      AuctionParams.fromAmino(params)
    )
  }

  public toAmino(): MsgUpdateAuctionParams.Amino {
    const { authority, params } = this
    return {
      type: 'block-sdk/x/auction/MsgUpdateParams',
      value: {
        authority,
        params: params.toAmino(),
      },
    }
  }

  public static fromData(
    data: MsgUpdateAuctionParams.Data
  ): MsgUpdateAuctionParams {
    const { authority, params } = data
    return new MsgUpdateAuctionParams(authority, AuctionParams.fromData(params))
  }

  public toData(): MsgUpdateAuctionParams.Data {
    const { authority, params } = this
    return {
      '@type': '/sdk.auction.v1.MsgUpdateParams',
      authority,
      params: params.toData(),
    }
  }

  public static fromProto(
    data: MsgUpdateAuctionParams.Proto
  ): MsgUpdateAuctionParams {
    return new MsgUpdateAuctionParams(
      data.authority,
      AuctionParams.fromProto(data.params as AuctionParams.Proto)
    )
  }

  public toProto(): MsgUpdateAuctionParams.Proto {
    const { authority, params } = this
    return MsgUpdateParams_pb.fromPartial({
      authority,
      params: params.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/sdk.auction.v1.MsgUpdateParams',
      value: MsgUpdateParams_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateAuctionParams {
    return MsgUpdateAuctionParams.fromProto(
      MsgUpdateParams_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateAuctionParams {
  export interface Amino {
    type: 'block-sdk/x/auction/MsgUpdateParams'
    value: {
      authority: AccAddress
      params: AuctionParams.Amino
    }
  }

  export interface Data {
    '@type': '/sdk.auction.v1.MsgUpdateParams'
    authority: AccAddress
    params: AuctionParams.Data
  }

  export type Proto = MsgUpdateParams_pb
}
