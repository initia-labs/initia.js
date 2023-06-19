import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { AuthParams } from '../AuthParams';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgUpdateParams as MsgUpdateParams_pb } from '@initia/initia.proto/cosmos/auth/v1beta1/tx';

export class MsgUpdateAuthParams extends JSONSerializable<
  MsgUpdateAuthParams.Amino,
  MsgUpdateAuthParams.Data,
  MsgUpdateAuthParams.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param params params defines the x/auth parameters to update
   */
  constructor(public authority: AccAddress, public params?: AuthParams) {
    super();
  }

  public static fromAmino(
    data: MsgUpdateAuthParams.Amino
  ): MsgUpdateAuthParams {
    const {
      value: { authority, params },
    } = data;
    return new MsgUpdateAuthParams(
      authority,
      params ? AuthParams.fromAmino(params) : undefined
    );
  }

  public toAmino(): MsgUpdateAuthParams.Amino {
    const { authority, params } = this;
    return {
      type: 'cosmos-sdk/x/auth/MsgUpdateParams',
      value: {
        authority,
        params: params?.toAmino(),
      },
    };
  }

  public static fromData(data: MsgUpdateAuthParams.Data): MsgUpdateAuthParams {
    const { authority, params } = data;
    return new MsgUpdateAuthParams(
      authority,
      params ? AuthParams.fromData(params) : undefined
    );
  }

  public toData(): MsgUpdateAuthParams.Data {
    const { authority, params } = this;
    return {
      '@type': '/cosmos.auth.v1beta1.MsgUpdateParams',
      authority,
      params: params?.toData(),
    };
  }

  public static fromProto(
    data: MsgUpdateAuthParams.Proto
  ): MsgUpdateAuthParams {
    return new MsgUpdateAuthParams(
      data.authority,
      data.params ? AuthParams.fromProto(data.params) : undefined
    );
  }

  public toProto(): MsgUpdateAuthParams.Proto {
    const { authority, params } = this;
    return MsgUpdateParams_pb.fromPartial({
      authority,
      params: params?.toProto(),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.auth.v1beta1.MsgUpdateParams',
      value: MsgUpdateParams_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgUpdateAuthParams {
    return MsgUpdateAuthParams.fromProto(
      MsgUpdateParams_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgUpdateAuthParams {
  export interface Amino {
    type: 'cosmos-sdk/x/auth/MsgUpdateParams';
    value: {
      authority: AccAddress;
      params?: AuthParams.Amino;
    };
  }

  export interface Data {
    '@type': '/cosmos.auth.v1beta1.MsgUpdateParams';
    authority: AccAddress;
    params?: AuthParams.Data;
  }

  export type Proto = MsgUpdateParams_pb;
}
