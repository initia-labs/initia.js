import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { GovParams } from '../GovParams'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUpdateParams as MsgUpdateParams_pb } from '@initia/initia.proto/initia/gov/v1/tx'

/**
 * MsgUpdateGovParams defines an operation for updating the gov module parameters.
 */
export class MsgUpdateGovParams extends JSONSerializable<
  MsgUpdateGovParams.Amino,
  MsgUpdateGovParams.Data,
  MsgUpdateGovParams.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param params the gov parameters to update
   */
  constructor(
    public authority: AccAddress,
    public params: GovParams
  ) {
    super()
  }

  public static fromAmino(data: MsgUpdateGovParams.Amino): MsgUpdateGovParams {
    const {
      value: { authority, params },
    } = data
    return new MsgUpdateGovParams(authority, GovParams.fromAmino(params))
  }

  public toAmino(): MsgUpdateGovParams.Amino {
    const { authority, params } = this
    return {
      type: 'gov/MsgUpdateParams',
      value: {
        authority,
        params: params.toAmino(),
      },
    }
  }

  public static fromData(data: MsgUpdateGovParams.Data): MsgUpdateGovParams {
    const { authority, params } = data
    return new MsgUpdateGovParams(authority, GovParams.fromData(params))
  }

  public toData(): MsgUpdateGovParams.Data {
    const { authority, params } = this
    return {
      '@type': '/initia.gov.v1.MsgUpdateParams',
      authority,
      params: params.toData(),
    }
  }

  public static fromProto(data: MsgUpdateGovParams.Proto): MsgUpdateGovParams {
    return new MsgUpdateGovParams(
      data.authority,
      GovParams.fromProto(data.params as GovParams.Proto)
    )
  }

  public toProto(): MsgUpdateGovParams.Proto {
    const { authority, params } = this
    return MsgUpdateParams_pb.fromPartial({
      authority,
      params: params.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.gov.v1.MsgUpdateParams',
      value: MsgUpdateParams_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateGovParams {
    return MsgUpdateGovParams.fromProto(MsgUpdateParams_pb.decode(msgAny.value))
  }
}

export namespace MsgUpdateGovParams {
  export interface Amino {
    type: 'gov/MsgUpdateParams'
    value: {
      authority: AccAddress
      params: GovParams.Amino
    }
  }

  export interface Data {
    '@type': '/initia.gov.v1.MsgUpdateParams'
    authority: AccAddress
    params: GovParams.Data
  }

  export type Proto = MsgUpdateParams_pb
}
