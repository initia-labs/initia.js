import { JSONSerializable } from '../../../../../util/json'
import { AccAddress } from '../../../../bech32'
import { IbcChannelParams } from '../IbcChannelParams'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUpdateParams as MsgUpdateParams_pb } from '@initia/initia.proto/ibc/core/channel/v1/tx'

export class MsgUpdateIbcChannelParams extends JSONSerializable<
  any,
  MsgUpdateIbcChannelParams.Data,
  MsgUpdateIbcChannelParams.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param params params defines the channel parameters to update
   */
  constructor(
    public authority: AccAddress,
    public params: IbcChannelParams
  ) {
    super()
  }

  public static fromAmino(_: any): MsgUpdateIbcChannelParams {
    _
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(
    data: MsgUpdateIbcChannelParams.Data
  ): MsgUpdateIbcChannelParams {
    const { authority, params } = data
    return new MsgUpdateIbcChannelParams(
      authority,
      IbcChannelParams.fromData(params)
    )
  }

  public toData(): MsgUpdateIbcChannelParams.Data {
    const { authority, params } = this
    return {
      '@type': '/ibc.core.channel.v1.MsgUpdateParams',
      authority,
      params: params.toData(),
    }
  }

  public static fromProto(
    data: MsgUpdateIbcChannelParams.Proto
  ): MsgUpdateIbcChannelParams {
    return new MsgUpdateIbcChannelParams(
      data.authority,
      IbcChannelParams.fromProto(data.params as IbcChannelParams.Proto)
    )
  }

  public toProto(): MsgUpdateIbcChannelParams.Proto {
    const { authority, params } = this
    return MsgUpdateParams_pb.fromPartial({
      authority,
      params: params.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.core.channel.v1.MsgUpdateParams',
      value: MsgUpdateParams_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateIbcChannelParams {
    return MsgUpdateIbcChannelParams.fromProto(
      MsgUpdateParams_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateIbcChannelParams {
  export interface Data {
    '@type': '/ibc.core.channel.v1.MsgUpdateParams'
    authority: AccAddress
    params: IbcChannelParams.Data
  }

  export type Proto = MsgUpdateParams_pb
}
