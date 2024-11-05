import { JSONSerializable } from '../../../../../util/json'
import { AccAddress } from '../../../../bech32'
import { IbcTransferParams } from '../IbcTransferParams'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUpdateParams as MsgUpdateParams_pb } from '@initia/initia.proto/ibc/applications/transfer/v1/tx'

export class MsgUpdateIbcTransferParams extends JSONSerializable<
  any,
  MsgUpdateIbcTransferParams.Data,
  MsgUpdateIbcTransferParams.Proto
> {
  /**
   * @param signer the address that controls the module
   * @param params params defines the parameters to update
   */
  constructor(
    public signer: AccAddress,
    public params: IbcTransferParams
  ) {
    super()
  }

  public static fromAmino(_: any): MsgUpdateIbcTransferParams {
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(
    data: MsgUpdateIbcTransferParams.Data
  ): MsgUpdateIbcTransferParams {
    const { signer, params } = data
    return new MsgUpdateIbcTransferParams(
      signer,
      IbcTransferParams.fromData(params)
    )
  }

  public toData(): MsgUpdateIbcTransferParams.Data {
    const { signer, params } = this
    return {
      '@type': '/ibc.applications.transfer.v1.MsgUpdateParams',
      signer,
      params: params.toData(),
    }
  }

  public static fromProto(
    data: MsgUpdateIbcTransferParams.Proto
  ): MsgUpdateIbcTransferParams {
    return new MsgUpdateIbcTransferParams(
      data.signer,
      IbcTransferParams.fromProto(data.params as IbcTransferParams.Proto)
    )
  }

  public toProto(): MsgUpdateIbcTransferParams.Proto {
    const { signer, params } = this
    return MsgUpdateParams_pb.fromPartial({
      signer,
      params: params.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.applications.transfer.v1.MsgUpdateParams',
      value: MsgUpdateParams_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateIbcTransferParams {
    return MsgUpdateIbcTransferParams.fromProto(
      MsgUpdateParams_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateIbcTransferParams {
  export interface Data {
    '@type': '/ibc.applications.transfer.v1.MsgUpdateParams'
    signer: AccAddress
    params: IbcTransferParams.Data
  }

  export type Proto = MsgUpdateParams_pb
}
