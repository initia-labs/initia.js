import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { MstakingParams } from '../MstakingParams';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgUpdateParams as MsgUpdateParams_pb } from '@initia/initia.proto/initia/mstaking/v1/tx';

export class MsgUpdateMstakingParams extends JSONSerializable<
  MsgUpdateMstakingParams.Amino,
  MsgUpdateMstakingParams.Data,
  MsgUpdateMstakingParams.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param params params defines the x/mstaking parameters to update
   */
  constructor(public authority: AccAddress, public params?: MstakingParams) {
    super();
  }

  public static fromAmino(
    data: MsgUpdateMstakingParams.Amino
  ): MsgUpdateMstakingParams {
    const {
      value: { authority, params },
    } = data;
    return new MsgUpdateMstakingParams(
      authority,
      params ? MstakingParams.fromAmino(params) : undefined
    );
  }

  public toAmino(): MsgUpdateMstakingParams.Amino {
    const { authority, params } = this;
    return {
      type: 'mstaking/MsgUpdateParams',
      value: {
        authority,
        params: params?.toAmino(),
      },
    };
  }

  public static fromData(
    data: MsgUpdateMstakingParams.Data
  ): MsgUpdateMstakingParams {
    const { authority, params } = data;
    return new MsgUpdateMstakingParams(
      authority,
      params ? MstakingParams.fromData(params) : undefined
    );
  }

  public toData(): MsgUpdateMstakingParams.Data {
    const { authority, params } = this;
    return {
      '@type': '/initia.mstaking.v1.MsgUpdateParams',
      authority,
      params: params?.toData(),
    };
  }

  public static fromProto(
    data: MsgUpdateMstakingParams.Proto
  ): MsgUpdateMstakingParams {
    return new MsgUpdateMstakingParams(
      data.authority,
      data.params ? MstakingParams.fromProto(data.params) : undefined
    );
  }

  public toProto(): MsgUpdateMstakingParams.Proto {
    const { authority, params } = this;
    return MsgUpdateParams_pb.fromPartial({
      authority,
      params: params?.toProto(),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.mstaking.v1.MsgUpdateParams',
      value: MsgUpdateParams_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgUpdateMstakingParams {
    return MsgUpdateMstakingParams.fromProto(
      MsgUpdateParams_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgUpdateMstakingParams {
  export interface Amino {
    type: 'mstaking/MsgUpdateParams';
    value: {
      authority: AccAddress;
      params?: MstakingParams.Amino;
    };
  }

  export interface Data {
    '@type': '/initia.mstaking.v1.MsgUpdateParams';
    authority: AccAddress;
    params?: MstakingParams.Data;
  }

  export type Proto = MsgUpdateParams_pb;
}
