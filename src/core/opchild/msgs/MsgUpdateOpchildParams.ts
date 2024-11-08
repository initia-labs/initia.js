import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { OpchildParams } from '../OpchildParams'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUpdateParams as MsgUpdateParams_pb } from '@initia/opinit.proto/opinit/opchild/v1/tx'

/**
 * MsgUpdateOpchildParams defines an operation for updating the opchild module parameters.
 */
export class MsgUpdateOpchildParams extends JSONSerializable<
  MsgUpdateOpchildParams.Amino,
  MsgUpdateOpchildParams.Data,
  MsgUpdateOpchildParams.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param params the opchild parameters to update
   */
  constructor(
    public authority: AccAddress,
    public params: OpchildParams
  ) {
    super()
  }

  public static fromAmino(
    data: MsgUpdateOpchildParams.Amino
  ): MsgUpdateOpchildParams {
    const {
      value: { authority, params },
    } = data
    return new MsgUpdateOpchildParams(
      authority,
      OpchildParams.fromAmino(params)
    )
  }

  public toAmino(): MsgUpdateOpchildParams.Amino {
    const { authority, params } = this
    return {
      type: 'opchild/MsgUpdateParams',
      value: {
        authority,
        params: params.toAmino(),
      },
    }
  }

  public static fromData(
    data: MsgUpdateOpchildParams.Data
  ): MsgUpdateOpchildParams {
    const { authority, params } = data
    return new MsgUpdateOpchildParams(authority, OpchildParams.fromData(params))
  }

  public toData(): MsgUpdateOpchildParams.Data {
    const { authority, params } = this
    return {
      '@type': '/opinit.opchild.v1.MsgUpdateParams',
      authority,
      params: params.toData(),
    }
  }

  public static fromProto(
    data: MsgUpdateOpchildParams.Proto
  ): MsgUpdateOpchildParams {
    return new MsgUpdateOpchildParams(
      data.authority,
      OpchildParams.fromProto(data.params as OpchildParams.Proto)
    )
  }

  public toProto(): MsgUpdateOpchildParams.Proto {
    const { authority, params } = this
    return MsgUpdateParams_pb.fromPartial({
      authority,
      params: params.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.opchild.v1.MsgUpdateParams',
      value: MsgUpdateParams_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateOpchildParams {
    return MsgUpdateOpchildParams.fromProto(
      MsgUpdateParams_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateOpchildParams {
  export interface Amino {
    type: 'opchild/MsgUpdateParams'
    value: {
      authority: AccAddress
      params: OpchildParams.Amino
    }
  }

  export interface Data {
    '@type': '/opinit.opchild.v1.MsgUpdateParams'
    authority: AccAddress
    params: OpchildParams.Data
  }

  export type Proto = MsgUpdateParams_pb
}
