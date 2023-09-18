import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { BuilderParams } from '../BuilderParams';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgUpdateParams as MsgUpdateParams_pb } from '@initia/initia.proto/pob/builder/v1/tx';

export class MsgUpdateBuilderParams extends JSONSerializable<
  MsgUpdateBuilderParams.Amino,
  MsgUpdateBuilderParams.Data,
  MsgUpdateBuilderParams.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param params params defines the x/auth parameters to update
   */
  constructor(public authority: AccAddress, public params: BuilderParams) {
    super();
  }

  public static fromAmino(
    data: MsgUpdateBuilderParams.Amino
  ): MsgUpdateBuilderParams {
    const {
      value: { authority, params },
    } = data;
    return new MsgUpdateBuilderParams(
      authority,
      BuilderParams.fromAmino(params)
    );
  }

  public toAmino(): MsgUpdateBuilderParams.Amino {
    const { authority, params } = this;
    return {
      type: 'pob/x/builder/MsgUpdateParams',
      value: {
        authority,
        params: params.toAmino(),
      },
    };
  }

  public static fromData(
    data: MsgUpdateBuilderParams.Data
  ): MsgUpdateBuilderParams {
    const { authority, params } = data;
    return new MsgUpdateBuilderParams(
      authority,
      BuilderParams.fromData(params)
    );
  }

  public toData(): MsgUpdateBuilderParams.Data {
    const { authority, params } = this;
    return {
      '@type': '/pob.builder.v1.MsgUpdateParams',
      authority,
      params: params.toData(),
    };
  }

  public static fromProto(
    data: MsgUpdateBuilderParams.Proto
  ): MsgUpdateBuilderParams {
    return new MsgUpdateBuilderParams(
      data.authority,
      BuilderParams.fromProto(data.params as BuilderParams.Proto)
    );
  }

  public toProto(): MsgUpdateBuilderParams.Proto {
    const { authority, params } = this;
    return MsgUpdateParams_pb.fromPartial({
      authority,
      params: params.toProto(),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/pob.builder.v1.MsgUpdateParams',
      value: MsgUpdateParams_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgUpdateBuilderParams {
    return MsgUpdateBuilderParams.fromProto(
      MsgUpdateParams_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgUpdateBuilderParams {
  export interface Amino {
    type: 'pob/x/builder/MsgUpdateParams';
    value: {
      authority: AccAddress;
      params: BuilderParams.Amino;
    };
  }

  export interface Data {
    '@type': '/pob.builder.v1.MsgUpdateParams';
    authority: AccAddress;
    params: BuilderParams.Data;
  }

  export type Proto = MsgUpdateParams_pb;
}
