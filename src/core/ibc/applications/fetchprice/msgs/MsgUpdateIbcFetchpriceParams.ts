import { JSONSerializable } from '../../../../../util/json';
import { AccAddress } from '../../../../bech32';
import { IbcFetchpriceParams } from '../IbcFetchpriceParams';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgUpdateParams as MsgUpdateParams_pb } from '@initia/initia.proto/ibc/applications/fetchprice/v1/tx';

export class MsgUpdateIbcFetchpriceParams extends JSONSerializable<
  any,
  MsgUpdateIbcFetchpriceParams.Data,
  MsgUpdateIbcFetchpriceParams.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param params params defines the parameters to update
   */
  constructor(
    public authority: AccAddress,
    public params: IbcFetchpriceParams
  ) {
    super();
  }

  public static fromAmino(
    data: MsgUpdateIbcFetchpriceParams.Amino
  ): MsgUpdateIbcFetchpriceParams {
    const {
      value: { authority, params },
    } = data;
    return new MsgUpdateIbcFetchpriceParams(
      authority,
      IbcFetchpriceParams.fromAmino(params)
    );
  }

  public toAmino(): MsgUpdateIbcFetchpriceParams.Amino {
    const { authority, params } = this;
    return {
      type: 'fetchprice/MsgUpdateParams',
      value: {
        authority,
        params: params.toAmino(),
      },
    };
  }

  public static fromData(
    data: MsgUpdateIbcFetchpriceParams.Data
  ): MsgUpdateIbcFetchpriceParams {
    const { authority, params } = data;
    return new MsgUpdateIbcFetchpriceParams(
      authority,
      IbcFetchpriceParams.fromData(params)
    );
  }

  public toData(): MsgUpdateIbcFetchpriceParams.Data {
    const { authority, params } = this;
    return {
      '@type': '/ibc.applications.fetchprice.v1.MsgUpdateParams',
      authority,
      params: params.toData(),
    };
  }

  public static fromProto(
    data: MsgUpdateIbcFetchpriceParams.Proto
  ): MsgUpdateIbcFetchpriceParams {
    return new MsgUpdateIbcFetchpriceParams(
      data.authority,
      IbcFetchpriceParams.fromProto(data.params as IbcFetchpriceParams.Proto)
    );
  }

  public toProto(): MsgUpdateIbcFetchpriceParams.Proto {
    const { authority, params } = this;
    return MsgUpdateParams_pb.fromPartial({
      authority,
      params: params.toProto(),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.applications.fetchprice.v1.MsgUpdateParams',
      value: MsgUpdateParams_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgUpdateIbcFetchpriceParams {
    return MsgUpdateIbcFetchpriceParams.fromProto(
      MsgUpdateParams_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgUpdateIbcFetchpriceParams {
  export interface Amino {
    type: 'fetchprice/MsgUpdateParams';
    value: {
      authority: AccAddress;
      params: IbcFetchpriceParams.Amino;
    };
  }

  export interface Data {
    '@type': '/ibc.applications.fetchprice.v1.MsgUpdateParams';
    authority: AccAddress;
    params: IbcFetchpriceParams.Data;
  }

  export type Proto = MsgUpdateParams_pb;
}
