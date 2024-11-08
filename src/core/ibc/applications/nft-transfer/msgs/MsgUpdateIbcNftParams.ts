import { JSONSerializable } from '../../../../../util/json'
import { AccAddress } from '../../../../bech32'
import { IbcNftParams } from '../IbcNftParams'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUpdateParams as MsgUpdateParams_pb } from '@initia/initia.proto/ibc/applications/nft_transfer/v1/tx'

export class MsgUpdateIbcNftParams extends JSONSerializable<
  MsgUpdateIbcNftParams.Amino,
  MsgUpdateIbcNftParams.Data,
  MsgUpdateIbcNftParams.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param params the parameters to update
   */
  constructor(
    public authority: AccAddress,
    public params: IbcNftParams
  ) {
    super()
  }

  public static fromAmino(
    data: MsgUpdateIbcNftParams.Amino
  ): MsgUpdateIbcNftParams {
    const {
      value: { authority, params },
    } = data
    return new MsgUpdateIbcNftParams(authority, IbcNftParams.fromAmino(params))
  }

  public toAmino(): MsgUpdateIbcNftParams.Amino {
    const { authority, params } = this
    return {
      type: 'nft-transfer/MsgUpdateParams',
      value: {
        authority,
        params: params.toAmino(),
      },
    }
  }

  public static fromData(
    data: MsgUpdateIbcNftParams.Data
  ): MsgUpdateIbcNftParams {
    const { authority, params } = data
    return new MsgUpdateIbcNftParams(authority, IbcNftParams.fromData(params))
  }

  public toData(): MsgUpdateIbcNftParams.Data {
    const { authority, params } = this
    return {
      '@type': '/ibc.applications.nft_transfer.v1.MsgUpdateParams',
      authority,
      params: params.toData(),
    }
  }

  public static fromProto(
    data: MsgUpdateIbcNftParams.Proto
  ): MsgUpdateIbcNftParams {
    return new MsgUpdateIbcNftParams(
      data.authority,
      IbcNftParams.fromProto(data.params as IbcNftParams.Proto)
    )
  }

  public toProto(): MsgUpdateIbcNftParams.Proto {
    const { authority, params } = this
    return MsgUpdateParams_pb.fromPartial({
      authority,
      params: params.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.applications.nft_transfer.v1.MsgUpdateParams',
      value: MsgUpdateParams_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateIbcNftParams {
    return MsgUpdateIbcNftParams.fromProto(
      MsgUpdateParams_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateIbcNftParams {
  export interface Amino {
    type: 'nft-transfer/MsgUpdateParams'
    value: {
      authority: AccAddress
      params: IbcNftParams.Amino
    }
  }

  export interface Data {
    '@type': '/ibc.applications.nft_transfer.v1.MsgUpdateParams'
    authority: AccAddress
    params: IbcNftParams.Data
  }

  export type Proto = MsgUpdateParams_pb
}
