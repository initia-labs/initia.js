import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { SlashingParams } from '../SlashingParams';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgUpdateParams as MsgUpdateParams_pb } from '@initia/initia.proto/cosmos/slashing/v1beta1/tx';

export class MsgUpdateSlashingParams extends JSONSerializable<
  MsgUpdateSlashingParams.Amino,
  MsgUpdateSlashingParams.Data,
  MsgUpdateSlashingParams.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param params params defines the x/slashing parameters to update
   */
  constructor(public authority: AccAddress, public params: SlashingParams) {
    super();
  }

  public static fromAmino(
    data: MsgUpdateSlashingParams.Amino
  ): MsgUpdateSlashingParams {
    const {
      value: { authority, params },
    } = data;
    return new MsgUpdateSlashingParams(
      authority,
      SlashingParams.fromAmino(params)
    );
  }

  public toAmino(): MsgUpdateSlashingParams.Amino {
    const { authority, params } = this;
    return {
      type: 'cosmos-sdk/x/slashing/MsgUpdateParams',
      value: {
        authority,
        params: params.toAmino(),
      },
    };
  }

  public static fromData(
    data: MsgUpdateSlashingParams.Data
  ): MsgUpdateSlashingParams {
    const { authority, params } = data;
    return new MsgUpdateSlashingParams(
      authority,
      SlashingParams.fromData(params)
    );
  }

  public toData(): MsgUpdateSlashingParams.Data {
    const { authority, params } = this;
    return {
      '@type': '/cosmos.slashing.v1beta1.MsgUpdateParams',
      authority,
      params: params.toData(),
    };
  }

  public static fromProto(
    data: MsgUpdateSlashingParams.Proto
  ): MsgUpdateSlashingParams {
    return new MsgUpdateSlashingParams(
      data.authority,
      SlashingParams.fromProto(data.params as SlashingParams.Proto)
    );
  }

  public toProto(): MsgUpdateSlashingParams.Proto {
    const { authority, params } = this;
    return MsgUpdateParams_pb.fromPartial({
      authority,
      params: params.toProto(),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.slashing.v1beta1.MsgUpdateParams',
      value: MsgUpdateParams_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgUpdateSlashingParams {
    return MsgUpdateSlashingParams.fromProto(
      MsgUpdateParams_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgUpdateSlashingParams {
  export interface Amino {
    type: 'cosmos-sdk/x/slashing/MsgUpdateParams';
    value: {
      authority: AccAddress;
      params: SlashingParams.Amino;
    };
  }

  export interface Data {
    '@type': '/cosmos.slashing.v1beta1.MsgUpdateParams';
    authority: AccAddress;
    params: SlashingParams.Data;
  }

  export type Proto = MsgUpdateParams_pb;
}
