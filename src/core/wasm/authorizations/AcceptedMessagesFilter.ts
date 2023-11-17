import { JSONSerializable } from '../../../util/json';
import { AcceptedMessagesFilter as AcceptedMessagesFilter_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/authz';
import { Any } from '@initia/initia.proto/google/protobuf/any';

export class AcceptedMessagesFilter extends JSONSerializable<
  AcceptedMessagesFilter.Amino,
  AcceptedMessagesFilter.Data,
  AcceptedMessagesFilter.Proto
> {
  constructor(public messages: string[]) {
    super();
  }

  public static fromAmino(
    data: AcceptedMessagesFilter.Amino
  ): AcceptedMessagesFilter {
    return new AcceptedMessagesFilter(data.value.messages);
  }

  public toAmino(): AcceptedMessagesFilter.Amino {
    return {
      type: 'wasm/AcceptedMessagesFilter',
      value: { messages: this.messages },
    };
  }

  public static fromData(
    data: AcceptedMessagesFilter.Data
  ): AcceptedMessagesFilter {
    return new AcceptedMessagesFilter(data.messages);
  }

  public toData(): AcceptedMessagesFilter.Data {
    return {
      '@type': '/cosmwasm.wasm.v1.AcceptedMessagesFilter',
      messages: this.messages,
    };
  }

  public static fromProto(
    data: AcceptedMessagesFilter.Proto
  ): AcceptedMessagesFilter {
    return new AcceptedMessagesFilter(
      data.messages.map(msg => Buffer.from(msg).toString('base64'))
    );
  }

  public toProto(): AcceptedMessagesFilter.Proto {
    return AcceptedMessagesFilter_pb.fromPartial({
      messages: this.messages.map(msg => Buffer.from(msg, 'base64')),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.AcceptedMessagesFilter',
      value: AcceptedMessagesFilter_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): AcceptedMessagesFilter {
    return AcceptedMessagesFilter.fromProto(
      AcceptedMessagesFilter_pb.decode(msgAny.value)
    );
  }
}

export namespace AcceptedMessagesFilter {
  export interface Amino {
    type: 'wasm/AcceptedMessagesFilter';
    value: { messages: string[] };
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.AcceptedMessagesFilter';
    messages: string[];
  }

  export type Proto = AcceptedMessagesFilter_pb;
}
