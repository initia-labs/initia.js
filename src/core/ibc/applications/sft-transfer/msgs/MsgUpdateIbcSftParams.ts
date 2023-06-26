import { JSONSerializable } from '../../../../../util/json';
import { AccAddress } from '../../../../bech32';
import { IbcSftParams } from '../IbcSftParams';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgUpdateParams as MsgUpdateParams_pb } from '@initia/initia.proto/ibc/applications/sft_transfer/v1/tx';

export class MsgUpdateIbcSftParams extends JSONSerializable<
  MsgUpdateIbcSftParams.Amino,
  MsgUpdateIbcSftParams.Data,
  MsgUpdateIbcSftParams.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param params params defines the parameters to update
   */
  constructor(public authority: AccAddress, public params: IbcSftParams) {
    super();
  }

  public static fromAmino(
    data: MsgUpdateIbcSftParams.Amino
  ): MsgUpdateIbcSftParams {
    const {
      value: { authority, params },
    } = data;
    return new MsgUpdateIbcSftParams(authority, IbcSftParams.fromAmino(params));
  }

  public toAmino(): MsgUpdateIbcSftParams.Amino {
    const { authority, params } = this;
    return {
      type: 'sft-transfer/MsgUpdateParams',
      value: {
        authority,
        params: params.toAmino(),
      },
    };
  }

  public static fromData(
    data: MsgUpdateIbcSftParams.Data
  ): MsgUpdateIbcSftParams {
    const { authority, params } = data;
    return new MsgUpdateIbcSftParams(authority, IbcSftParams.fromData(params));
  }

  public toData(): MsgUpdateIbcSftParams.Data {
    const { authority, params } = this;
    return {
      '@type': '/ibc.applications.sft_transfer.v1.MsgUpdateParams',
      authority,
      params: params.toData(),
    };
  }

  public static fromProto(
    data: MsgUpdateIbcSftParams.Proto
  ): MsgUpdateIbcSftParams {
    return new MsgUpdateIbcSftParams(
      data.authority,
      IbcSftParams.fromProto(data.params as IbcSftParams.Proto)
    );
  }

  public toProto(): MsgUpdateIbcSftParams.Proto {
    const { authority, params } = this;
    return MsgUpdateParams_pb.fromPartial({
      authority,
      params: params.toProto(),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.applications.sft_transfer.v1.MsgUpdateParams',
      value: MsgUpdateParams_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgUpdateIbcSftParams {
    return MsgUpdateIbcSftParams.fromProto(
      MsgUpdateParams_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgUpdateIbcSftParams {
  export interface Amino {
    type: 'sft-transfer/MsgUpdateParams';
    value: {
      authority: AccAddress;
      params: IbcSftParams.Amino;
    };
  }

  export interface Data {
    '@type': '/ibc.applications.sft_transfer.v1.MsgUpdateParams';
    authority: AccAddress;
    params: IbcSftParams.Data;
  }

  export type Proto = MsgUpdateParams_pb;
}
