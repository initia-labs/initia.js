import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { EvmParams } from '../EvmParams'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUpdateParams as MsgUpdateParams_pb } from '@initia/initia.proto/minievm/evm/v1/tx'

/**
 * MsgUpdateEvmParams defines an operation for updating the evm module parameters.
 */
export class MsgUpdateEvmParams extends JSONSerializable<
  MsgUpdateEvmParams.Amino,
  MsgUpdateEvmParams.Data,
  MsgUpdateEvmParams.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param params the evm parameters to update
   */
  constructor(
    public authority: AccAddress,
    public params: EvmParams
  ) {
    super()
  }

  public static fromAmino(data: MsgUpdateEvmParams.Amino): MsgUpdateEvmParams {
    const {
      value: { authority, params },
    } = data
    return new MsgUpdateEvmParams(authority, EvmParams.fromAmino(params))
  }

  public toAmino(): MsgUpdateEvmParams.Amino {
    const { authority, params } = this
    return {
      type: 'evm/MsgUpdateParams',
      value: {
        authority,
        params: params.toAmino(),
      },
    }
  }

  public static fromData(data: MsgUpdateEvmParams.Data): MsgUpdateEvmParams {
    const { authority, params } = data
    return new MsgUpdateEvmParams(authority, EvmParams.fromData(params))
  }

  public toData(): MsgUpdateEvmParams.Data {
    const { authority, params } = this
    return {
      '@type': '/minievm.evm.v1.MsgUpdateParams',
      authority,
      params: params.toData(),
    }
  }

  public static fromProto(data: MsgUpdateEvmParams.Proto): MsgUpdateEvmParams {
    return new MsgUpdateEvmParams(
      data.authority,
      EvmParams.fromProto(data.params as EvmParams.Proto)
    )
  }

  public toProto(): MsgUpdateEvmParams.Proto {
    const { authority, params } = this
    return MsgUpdateParams_pb.fromPartial({
      authority,
      params: params.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/minievm.evm.v1.MsgUpdateParams',
      value: MsgUpdateParams_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateEvmParams {
    return MsgUpdateEvmParams.fromProto(MsgUpdateParams_pb.decode(msgAny.value))
  }
}

export namespace MsgUpdateEvmParams {
  export interface Amino {
    type: 'evm/MsgUpdateParams'
    value: {
      authority: AccAddress
      params: EvmParams.Amino
    }
  }

  export interface Data {
    '@type': '/minievm.evm.v1.MsgUpdateParams'
    authority: AccAddress
    params: EvmParams.Data
  }

  export type Proto = MsgUpdateParams_pb
}
