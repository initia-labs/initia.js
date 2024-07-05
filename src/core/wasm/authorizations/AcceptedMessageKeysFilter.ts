import { JSONSerializable } from '../../../util/json'
import { AcceptedMessageKeysFilter as AcceptedMessageKeysFilter_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/authz'
import { Any } from '@initia/initia.proto/google/protobuf/any'

export class AcceptedMessageKeysFilter extends JSONSerializable<
  AcceptedMessageKeysFilter.Amino,
  AcceptedMessageKeysFilter.Data,
  AcceptedMessageKeysFilter.Proto
> {
  constructor(public keys: string[]) {
    super()
  }

  public static fromAmino(
    data: AcceptedMessageKeysFilter.Amino
  ): AcceptedMessageKeysFilter {
    return new AcceptedMessageKeysFilter(data.value.keys)
  }

  public toAmino(): AcceptedMessageKeysFilter.Amino {
    return {
      type: 'wasm/AcceptedMessageKeysFilter',
      value: { keys: this.keys },
    }
  }

  public static fromData(
    data: AcceptedMessageKeysFilter.Data
  ): AcceptedMessageKeysFilter {
    return new AcceptedMessageKeysFilter(data.keys)
  }

  public toData(): AcceptedMessageKeysFilter.Data {
    return {
      '@type': '/cosmwasm.wasm.v1.AcceptedMessageKeysFilter',
      keys: this.keys,
    }
  }

  public static fromProto(
    data: AcceptedMessageKeysFilter.Proto
  ): AcceptedMessageKeysFilter {
    return new AcceptedMessageKeysFilter(data.keys)
  }

  public toProto(): AcceptedMessageKeysFilter.Proto {
    return AcceptedMessageKeysFilter_pb.fromPartial({ keys: this.keys })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.AcceptedMessageKeysFilter',
      value: AcceptedMessageKeysFilter_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): AcceptedMessageKeysFilter {
    return AcceptedMessageKeysFilter.fromProto(
      AcceptedMessageKeysFilter_pb.decode(msgAny.value)
    )
  }
}

export namespace AcceptedMessageKeysFilter {
  export interface Amino {
    type: 'wasm/AcceptedMessageKeysFilter'
    value: { keys: string[] }
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.AcceptedMessageKeysFilter'
    keys: string[]
  }

  export type Proto = AcceptedMessageKeysFilter_pb
}
