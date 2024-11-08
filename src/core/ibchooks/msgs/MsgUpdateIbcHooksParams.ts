import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { IbcHooksParams } from '../IbcHooksParams'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUpdateParams as MsgUpdateParams_pb } from '@initia/initia.proto/initia/ibchooks/v1/tx'

/**
 * MsgUpdateIbcHooksParams defines an operation for updating the ibc hooks module parameters.
 */
export class MsgUpdateIbcHooksParams extends JSONSerializable<
  MsgUpdateIbcHooksParams.Amino,
  MsgUpdateIbcHooksParams.Data,
  MsgUpdateIbcHooksParams.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param params the ibc hooks parameters to update
   */
  constructor(
    public authority: AccAddress,
    public params: IbcHooksParams
  ) {
    super()
  }

  public static fromAmino(
    data: MsgUpdateIbcHooksParams.Amino
  ): MsgUpdateIbcHooksParams {
    const {
      value: { authority, params },
    } = data
    return new MsgUpdateIbcHooksParams(
      authority,
      IbcHooksParams.fromAmino(params)
    )
  }

  public toAmino(): MsgUpdateIbcHooksParams.Amino {
    const { authority, params } = this
    return {
      type: 'ibchooks/MsgUpdateParams',
      value: {
        authority,
        params: params.toAmino(),
      },
    }
  }

  public static fromData(
    data: MsgUpdateIbcHooksParams.Data
  ): MsgUpdateIbcHooksParams {
    const { authority, params } = data
    return new MsgUpdateIbcHooksParams(
      authority,
      IbcHooksParams.fromData(params)
    )
  }

  public toData(): MsgUpdateIbcHooksParams.Data {
    const { authority, params } = this
    return {
      '@type': '/initia.ibchooks.v1.MsgUpdateParams',
      authority,
      params: params.toData(),
    }
  }

  public static fromProto(
    data: MsgUpdateIbcHooksParams.Proto
  ): MsgUpdateIbcHooksParams {
    return new MsgUpdateIbcHooksParams(
      data.authority,
      IbcHooksParams.fromProto(data.params as IbcHooksParams.Proto)
    )
  }

  public toProto(): MsgUpdateIbcHooksParams.Proto {
    const { authority, params } = this
    return MsgUpdateParams_pb.fromPartial({
      authority,
      params: params.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.ibchooks.v1.MsgUpdateParams',
      value: MsgUpdateParams_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateIbcHooksParams {
    return MsgUpdateIbcHooksParams.fromProto(
      MsgUpdateParams_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateIbcHooksParams {
  export interface Amino {
    type: 'ibchooks/MsgUpdateParams'
    value: {
      authority: AccAddress
      params: IbcHooksParams.Amino
    }
  }

  export interface Data {
    '@type': '/initia.ibchooks.v1.MsgUpdateParams'
    authority: AccAddress
    params: IbcHooksParams.Data
  }

  export type Proto = MsgUpdateParams_pb
}
