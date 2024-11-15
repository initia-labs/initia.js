import { JSONSerializable } from '../../../util/json'
import { MaxCallsLimit as MaxCallsLimit_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/authz'
import { Any } from '@initia/initia.proto/google/protobuf/any'

/**
 * MaxCallsLimit is limited number of calls to the contract. No funds transferable.
 */
export class MaxCallsLimit extends JSONSerializable<
  MaxCallsLimit.Amino,
  MaxCallsLimit.Data,
  MaxCallsLimit.Proto
> {
  /**
   * @param remaining remaining number that is decremented on each execution
   */
  constructor(public remaining: number) {
    super()
  }

  public static fromAmino(data: MaxCallsLimit.Amino): MaxCallsLimit {
    return new MaxCallsLimit(parseInt(data.value.remaining))
  }

  public toAmino(): MaxCallsLimit.Amino {
    return {
      type: 'wasm/MaxCallsLimit',
      value: { remaining: this.remaining.toFixed() },
    }
  }

  public static fromData(data: MaxCallsLimit.Data): MaxCallsLimit {
    return new MaxCallsLimit(parseInt(data.remaining))
  }

  public toData(): MaxCallsLimit.Data {
    return {
      '@type': '/cosmwasm.wasm.v1.MaxCallsLimit',
      remaining: this.remaining.toFixed(),
    }
  }

  public static fromProto(data: MaxCallsLimit.Proto): MaxCallsLimit {
    return new MaxCallsLimit(Number(data.remaining))
  }

  public toProto(): MaxCallsLimit.Proto {
    return MaxCallsLimit_pb.fromPartial({
      remaining: BigInt(this.remaining),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.MaxCallsLimit',
      value: MaxCallsLimit_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MaxCallsLimit {
    return MaxCallsLimit.fromProto(MaxCallsLimit_pb.decode(msgAny.value))
  }
}

export namespace MaxCallsLimit {
  export interface Amino {
    type: 'wasm/MaxCallsLimit'
    value: { remaining: string }
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.MaxCallsLimit'
    remaining: string
  }

  export type Proto = MaxCallsLimit_pb
}
