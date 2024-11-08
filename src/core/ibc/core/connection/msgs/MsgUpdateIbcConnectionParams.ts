import { JSONSerializable } from '../../../../../util/json'
import { AccAddress } from '../../../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUpdateParams as MsgUpdateParams_pb } from '@initia/initia.proto/ibc/core/connection/v1/tx'
import { IbcConnectionParams } from '../IbcConnectionParams'

/**
 * MsgUpdateIbcConnectionParams defines an operation for updating the ibc connection module parameters.
 */
export class MsgUpdateIbcConnectionParams extends JSONSerializable<
  any,
  MsgUpdateIbcConnectionParams.Data,
  MsgUpdateIbcConnectionParams.Proto
> {
  /**
   * @param signer signer address
   * @param params the ibc connection parameters to update
   */
  constructor(
    public signer: AccAddress,
    public params: IbcConnectionParams
  ) {
    super()
  }

  public static fromAmino(_: any): MsgUpdateIbcConnectionParams {
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(
    data: MsgUpdateIbcConnectionParams.Data
  ): MsgUpdateIbcConnectionParams {
    const { signer, params } = data
    return new MsgUpdateIbcConnectionParams(
      signer,
      IbcConnectionParams.fromData(params)
    )
  }

  public toData(): MsgUpdateIbcConnectionParams.Data {
    const { signer, params } = this
    return {
      '@type': '/ibc.core.connection.v1.MsgUpdateParams',
      signer,
      params: params.toData(),
    }
  }

  public static fromProto(
    data: MsgUpdateIbcConnectionParams.Proto
  ): MsgUpdateIbcConnectionParams {
    return new MsgUpdateIbcConnectionParams(
      data.signer,
      IbcConnectionParams.fromProto(data.params as IbcConnectionParams.Proto)
    )
  }

  public toProto(): MsgUpdateIbcConnectionParams.Proto {
    const { signer, params } = this
    return MsgUpdateParams_pb.fromPartial({
      signer,
      params: params.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.core.connection.v1.MsgUpdateParams',
      value: MsgUpdateParams_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateIbcConnectionParams {
    return MsgUpdateIbcConnectionParams.fromProto(
      MsgUpdateParams_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateIbcConnectionParams {
  export interface Data {
    '@type': '/ibc.core.connection.v1.MsgUpdateParams'
    signer: AccAddress
    params: IbcConnectionParams.Data
  }

  export type Proto = MsgUpdateParams_pb
}
