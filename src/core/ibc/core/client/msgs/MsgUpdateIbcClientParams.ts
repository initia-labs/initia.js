import { JSONSerializable } from '../../../../../util/json'
import { AccAddress } from '../../../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUpdateParams as MsgUpdateParams_pb } from '@initia/initia.proto/ibc/core/client/v1/tx'
import { IbcClientParams } from '../IbcClientParams'

/**
 * MsgUpdateIbcClientParams defines an operation for updating the ibc client module parameters.
 */
export class MsgUpdateIbcClientParams extends JSONSerializable<
  any,
  MsgUpdateIbcClientParams.Data,
  MsgUpdateIbcClientParams.Proto
> {
  /**
   * @param signer signer address
   * @param params the ibc client parameters to update
   */
  constructor(
    public signer: AccAddress,
    public params: IbcClientParams
  ) {
    super()
  }

  public static fromAmino(_: any): MsgUpdateIbcClientParams {
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(
    data: MsgUpdateIbcClientParams.Data
  ): MsgUpdateIbcClientParams {
    const { signer, params } = data
    return new MsgUpdateIbcClientParams(
      signer,
      IbcClientParams.fromData(params)
    )
  }

  public toData(): MsgUpdateIbcClientParams.Data {
    const { signer, params } = this
    return {
      '@type': '/ibc.core.client.v1.MsgUpdateParams',
      signer,
      params: params.toData(),
    }
  }

  public static fromProto(
    data: MsgUpdateIbcClientParams.Proto
  ): MsgUpdateIbcClientParams {
    return new MsgUpdateIbcClientParams(
      data.signer,
      IbcClientParams.fromProto(data.params as IbcClientParams.Proto)
    )
  }

  public toProto(): MsgUpdateIbcClientParams.Proto {
    const { signer, params } = this
    return MsgUpdateParams_pb.fromPartial({
      signer,
      params: params.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.core.client.v1.MsgUpdateParams',
      value: MsgUpdateParams_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateIbcClientParams {
    return MsgUpdateIbcClientParams.fromProto(
      MsgUpdateParams_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateIbcClientParams {
  export interface Data {
    '@type': '/ibc.core.client.v1.MsgUpdateParams'
    signer: AccAddress
    params: IbcClientParams.Data
  }

  export type Proto = MsgUpdateParams_pb
}
