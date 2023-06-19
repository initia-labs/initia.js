import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { DistributionParams } from '../DistributionParams';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgUpdateParams as MsgUpdateParams_pb } from '@initia/initia.proto/initia/distribution/v1/tx';

export class MsgUpdateDistrParams extends JSONSerializable<
  MsgUpdateDistrParams.Amino,
  MsgUpdateDistrParams.Data,
  MsgUpdateDistrParams.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param params params defines the x/distribution parameters to update
   */
  constructor(
    public authority: AccAddress,
    public params?: DistributionParams
  ) {
    super();
  }

  public static fromAmino(
    data: MsgUpdateDistrParams.Amino
  ): MsgUpdateDistrParams {
    const {
      value: { authority, params },
    } = data;
    return new MsgUpdateDistrParams(
      authority,
      params ? DistributionParams.fromAmino(params) : undefined
    );
  }

  public toAmino(): MsgUpdateDistrParams.Amino {
    const { authority, params } = this;
    return {
      type: 'distribution/MsgUpdateParams',
      value: {
        authority,
        params: params?.toAmino(),
      },
    };
  }

  public static fromData(
    data: MsgUpdateDistrParams.Data
  ): MsgUpdateDistrParams {
    const { authority, params } = data;
    return new MsgUpdateDistrParams(
      authority,
      params ? DistributionParams.fromData(params) : undefined
    );
  }

  public toData(): MsgUpdateDistrParams.Data {
    const { authority, params } = this;
    return {
      '@type': '/initia.distribution.v1.MsgUpdateParams',
      authority,
      params: params?.toData(),
    };
  }

  public static fromProto(
    data: MsgUpdateDistrParams.Proto
  ): MsgUpdateDistrParams {
    return new MsgUpdateDistrParams(
      data.authority,
      data.params ? DistributionParams.fromProto(data.params) : undefined
    );
  }

  public toProto(): MsgUpdateDistrParams.Proto {
    const { authority, params } = this;
    return MsgUpdateParams_pb.fromPartial({
      authority,
      params: params?.toProto(),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.distribution.v1.MsgUpdateParams',
      value: MsgUpdateParams_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgUpdateDistrParams {
    return MsgUpdateDistrParams.fromProto(
      MsgUpdateParams_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgUpdateDistrParams {
  export interface Amino {
    type: 'distribution/MsgUpdateParams';
    value: {
      authority: AccAddress;
      params?: DistributionParams.Amino;
    };
  }

  export interface Data {
    '@type': '/initia.distribution.v1.MsgUpdateParams';
    authority: AccAddress;
    params?: DistributionParams.Data;
  }

  export type Proto = MsgUpdateParams_pb;
}
