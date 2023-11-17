import { JSONSerializable } from '../../../util/json';
import { AllowAllMessagesFilter as AllowAllMessagesFilter_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/authz';
import { Any } from '@initia/initia.proto/google/protobuf/any';

export class AllowAllMessagesFilter extends JSONSerializable<
  AllowAllMessagesFilter.Amino,
  AllowAllMessagesFilter.Data,
  AllowAllMessagesFilter.Proto
> {
  constructor() {
    super();
  }

  public static fromAmino(
    _: AllowAllMessagesFilter.Amino
  ): AllowAllMessagesFilter {
    _;
    return new AllowAllMessagesFilter();
  }

  public toAmino(): AllowAllMessagesFilter.Amino {
    return {
      type: 'wasm/AllowAllMessagesFilter',
      value: {},
    };
  }

  public static fromData(
    _: AllowAllMessagesFilter.Data
  ): AllowAllMessagesFilter {
    _;
    return new AllowAllMessagesFilter();
  }

  public toData(): AllowAllMessagesFilter.Data {
    return {
      '@type': '/cosmwasm.wasm.v1.AllowAllMessagesFilter',
    };
  }

  public static fromProto(
    _: AllowAllMessagesFilter.Proto
  ): AllowAllMessagesFilter {
    _;
    return new AllowAllMessagesFilter();
  }

  public toProto(): AllowAllMessagesFilter.Proto {
    return AllowAllMessagesFilter_pb.fromPartial({});
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.AllowAllMessagesFilter',
      value: AllowAllMessagesFilter_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): AllowAllMessagesFilter {
    return AllowAllMessagesFilter.fromProto(
      AllowAllMessagesFilter_pb.decode(msgAny.value)
    );
  }
}

export namespace AllowAllMessagesFilter {
  export interface Amino {
    type: 'wasm/AllowAllMessagesFilter';
    value: {};
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.AllowAllMessagesFilter';
  }

  export type Proto = AllowAllMessagesFilter_pb;
}
