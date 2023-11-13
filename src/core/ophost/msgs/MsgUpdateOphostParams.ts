import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { OphostParams } from '../OphostParams';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgUpdateParams as MsgUpdateParams_pb } from '@initia/opinit.proto/opinit/ophost/v1/tx';

export class MsgUpdateOphostParams extends JSONSerializable<
  MsgUpdateOphostParams.Amino,
  MsgUpdateOphostParams.Data,
  MsgUpdateOphostParams.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param params params defines the x/move parameters to update
   */
  constructor(public authority: AccAddress, public params: OphostParams) {
    super();
  }

  public static fromAmino(
    data: MsgUpdateOphostParams.Amino
  ): MsgUpdateOphostParams {
    const {
      value: { authority, params },
    } = data;
    return new MsgUpdateOphostParams(authority, OphostParams.fromAmino(params));
  }

  public toAmino(): MsgUpdateOphostParams.Amino {
    const { authority, params } = this;
    return {
      type: 'ophost/MsgUpdateParams',
      value: {
        authority,
        params: params.toAmino(),
      },
    };
  }

  public static fromData(
    data: MsgUpdateOphostParams.Data
  ): MsgUpdateOphostParams {
    const { authority, params } = data;
    return new MsgUpdateOphostParams(authority, OphostParams.fromData(params));
  }

  public toData(): MsgUpdateOphostParams.Data {
    const { authority, params } = this;
    return {
      '@type': '/opinit.ophost.v1.MsgUpdateParams',
      authority,
      params: params.toData(),
    };
  }

  public static fromProto(
    data: MsgUpdateOphostParams.Proto
  ): MsgUpdateOphostParams {
    return new MsgUpdateOphostParams(
      data.authority,
      OphostParams.fromProto(data.params as OphostParams.Proto)
    );
  }

  public toProto(): MsgUpdateOphostParams.Proto {
    const { authority, params } = this;
    return MsgUpdateParams_pb.fromPartial({
      authority,
      params: params.toProto(),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.ophost.v1.MsgUpdateParams',
      value: MsgUpdateParams_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgUpdateOphostParams {
    return MsgUpdateOphostParams.fromProto(
      MsgUpdateParams_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgUpdateOphostParams {
  export interface Amino {
    type: 'ophost/MsgUpdateParams';
    value: {
      authority: AccAddress;
      params: OphostParams.Amino;
    };
  }

  export interface Data {
    '@type': '/opinit.ophost.v1.MsgUpdateParams';
    authority: AccAddress;
    params: OphostParams.Data;
  }

  export type Proto = MsgUpdateParams_pb;
}
