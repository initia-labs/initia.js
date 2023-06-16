import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Coin } from '../../Coin';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgUpdateParams as MsgUpdateParams_pb } from '@initia/initia.proto/cosmos/crisis/v1beta1/tx';

export class MsgUpdateCrisisParams extends JSONSerializable<
  MsgUpdateCrisisParams.Amino,
  MsgUpdateCrisisParams.Data,
  MsgUpdateCrisisParams.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param constant_fee constant_fee defines the x/crisis parameters to update
   */
  constructor(public authority: AccAddress, public constant_fee?: Coin) {
    super();
  }

  public static fromAmino(
    data: MsgUpdateCrisisParams.Amino
  ): MsgUpdateCrisisParams {
    const {
      value: { authority, constant_fee },
    } = data;
    return new MsgUpdateCrisisParams(
      authority,
      constant_fee ? Coin.fromAmino(constant_fee) : undefined
    );
  }

  public toAmino(): MsgUpdateCrisisParams.Amino {
    const { authority, constant_fee } = this;
    return {
      type: 'cosmos-sdk/x/crisis/MsgUpdateParams',
      value: {
        authority,
        constant_fee: constant_fee?.toAmino(),
      },
    };
  }

  public static fromData(
    data: MsgUpdateCrisisParams.Data
  ): MsgUpdateCrisisParams {
    const { authority, constant_fee } = data;
    return new MsgUpdateCrisisParams(
      authority,
      constant_fee ? Coin.fromData(constant_fee) : undefined
    );
  }

  public toData(): MsgUpdateCrisisParams.Data {
    const { authority, constant_fee } = this;
    return {
      '@type': '/cosmos.crisis.v1beta1.MsgUpdateParams',
      authority,
      constant_fee: constant_fee?.toData(),
    };
  }

  public static fromProto(
    data: MsgUpdateCrisisParams.Proto
  ): MsgUpdateCrisisParams {
    return new MsgUpdateCrisisParams(
      data.authority,
      data.constantFee ? Coin.fromProto(data.constantFee) : undefined
    );
  }

  public toProto(): MsgUpdateCrisisParams.Proto {
    const { authority, constant_fee } = this;
    return MsgUpdateParams_pb.fromPartial({
      authority,
      constantFee: constant_fee?.toProto(),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.crisis.v1beta1.MsgUpdateParams',
      value: MsgUpdateParams_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgUpdateCrisisParams {
    return MsgUpdateCrisisParams.fromProto(
      MsgUpdateParams_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgUpdateCrisisParams {
  export interface Amino {
    type: 'cosmos-sdk/x/crisis/MsgUpdateParams';
    value: {
      authority: AccAddress;
      constant_fee?: Coin.Amino;
    };
  }

  export interface Data {
    '@type': '/cosmos.crisis.v1beta1.MsgUpdateParams';
    authority: AccAddress;
    constant_fee?: Coin.Data;
  }

  export type Proto = MsgUpdateParams_pb;
}
