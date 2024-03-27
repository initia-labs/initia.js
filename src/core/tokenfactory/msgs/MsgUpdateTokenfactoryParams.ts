import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { TokenfactoryParams } from '../TokenfactoryParams';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgUpdateParams as MsgUpdateParams_pb } from '@initia/initia.proto/miniwasm/tokenfactory/v1/tx';

export class MsgUpdateTokenfactoryParams extends JSONSerializable<
  MsgUpdateTokenfactoryParams.Amino,
  MsgUpdateTokenfactoryParams.Data,
  MsgUpdateTokenfactoryParams.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param params params defines the x/tokenfactory parameters to update
   */
  constructor(public authority: AccAddress, public params: TokenfactoryParams) {
    super();
  }

  public static fromAmino(
    data: MsgUpdateTokenfactoryParams.Amino
  ): MsgUpdateTokenfactoryParams {
    const {
      value: { authority, params },
    } = data;
    return new MsgUpdateTokenfactoryParams(
      authority,
      TokenfactoryParams.fromAmino(params)
    );
  }

  public toAmino(): MsgUpdateTokenfactoryParams.Amino {
    const { authority, params } = this;
    return {
      type: 'tokenfactory/MsgUpdateParams',
      value: {
        authority,
        params: params.toAmino(),
      },
    };
  }

  public static fromData(
    data: MsgUpdateTokenfactoryParams.Data
  ): MsgUpdateTokenfactoryParams {
    const { authority, params } = data;
    return new MsgUpdateTokenfactoryParams(
      authority,
      TokenfactoryParams.fromData(params)
    );
  }

  public toData(): MsgUpdateTokenfactoryParams.Data {
    const { authority, params } = this;
    return {
      '@type': '/miniwasm.tokenfactory.v1.MsgUpdateParams',
      authority,
      params: params.toData(),
    };
  }

  public static fromProto(
    data: MsgUpdateTokenfactoryParams.Proto
  ): MsgUpdateTokenfactoryParams {
    return new MsgUpdateTokenfactoryParams(
      data.authority,
      TokenfactoryParams.fromProto(data.params as TokenfactoryParams.Proto)
    );
  }

  public toProto(): MsgUpdateTokenfactoryParams.Proto {
    const { authority, params } = this;
    return MsgUpdateParams_pb.fromPartial({
      authority,
      params: params.toProto(),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/miniwasm.tokenfactory.v1.MsgUpdateParams',
      value: MsgUpdateParams_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgUpdateTokenfactoryParams {
    return MsgUpdateTokenfactoryParams.fromProto(
      MsgUpdateParams_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgUpdateTokenfactoryParams {
  export interface Amino {
    type: 'tokenfactory/MsgUpdateParams';
    value: {
      authority: AccAddress;
      params: TokenfactoryParams.Amino;
    };
  }

  export interface Data {
    '@type': '/miniwasm.tokenfactory.v1.MsgUpdateParams';
    authority: AccAddress;
    params: TokenfactoryParams.Data;
  }

  export type Proto = MsgUpdateParams_pb;
}
