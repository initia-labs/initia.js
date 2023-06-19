import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { RewardParams } from '../RewardParams';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgUpdateParams as MsgUpdateParams_pb } from '@initia/initia.proto/initia/reward/v1/tx';

export class MsgUpdateRewardParams extends JSONSerializable<
  MsgUpdateRewardParams.Amino,
  MsgUpdateRewardParams.Data,
  MsgUpdateRewardParams.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param params params defines the x/reward parameters to update
   */
  constructor(public authority: AccAddress, public params?: RewardParams) {
    super();
  }

  public static fromAmino(
    data: MsgUpdateRewardParams.Amino
  ): MsgUpdateRewardParams {
    const {
      value: { authority, params },
    } = data;
    return new MsgUpdateRewardParams(
      authority,
      params ? RewardParams.fromAmino(params) : undefined
    );
  }

  public toAmino(): MsgUpdateRewardParams.Amino {
    const { authority, params } = this;
    return {
      type: 'reward/MsgUpdateParams',
      value: {
        authority,
        params: params?.toAmino(),
      },
    };
  }

  public static fromData(
    data: MsgUpdateRewardParams.Data
  ): MsgUpdateRewardParams {
    const { authority, params } = data;
    return new MsgUpdateRewardParams(
      authority,
      params ? RewardParams.fromData(params) : undefined
    );
  }

  public toData(): MsgUpdateRewardParams.Data {
    const { authority, params } = this;
    return {
      '@type': '/initia.reward.v1.MsgUpdateParams',
      authority,
      params: params?.toData(),
    };
  }

  public static fromProto(
    data: MsgUpdateRewardParams.Proto
  ): MsgUpdateRewardParams {
    return new MsgUpdateRewardParams(
      data.authority,
      data.params ? RewardParams.fromProto(data.params) : undefined
    );
  }

  public toProto(): MsgUpdateRewardParams.Proto {
    const { authority, params } = this;
    return MsgUpdateParams_pb.fromPartial({
      authority,
      params: params?.toProto(),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.reward.v1.MsgUpdateParams',
      value: MsgUpdateParams_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgUpdateRewardParams {
    return MsgUpdateRewardParams.fromProto(
      MsgUpdateParams_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgUpdateRewardParams {
  export interface Amino {
    type: 'reward/MsgUpdateParams';
    value: {
      authority: AccAddress;
      params?: RewardParams.Amino;
    };
  }

  export interface Data {
    '@type': '/initia.reward.v1.MsgUpdateParams';
    authority: AccAddress;
    params?: RewardParams.Data;
  }

  export type Proto = MsgUpdateParams_pb;
}
