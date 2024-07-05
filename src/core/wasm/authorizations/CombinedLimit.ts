import { JSONSerializable } from '../../../util/json'
import { Coins } from '../../Coins'
import { CombinedLimit as CombinedLimit_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/authz'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import Long from 'long'

export class CombinedLimit extends JSONSerializable<
  CombinedLimit.Amino,
  CombinedLimit.Data,
  CombinedLimit.Proto
> {
  public amounts: Coins

  constructor(
    public calls_remaining: number,
    amounts: Coins.Input
  ) {
    super()
    this.amounts = new Coins(amounts)
  }

  public static fromAmino(data: CombinedLimit.Amino): CombinedLimit {
    const {
      value: { calls_remaining, amounts },
    } = data
    return new CombinedLimit(
      Number.parseInt(calls_remaining),
      Coins.fromAmino(amounts)
    )
  }

  public toAmino(): CombinedLimit.Amino {
    const { calls_remaining, amounts } = this
    return {
      type: 'wasm/CombinedLimit',
      value: {
        calls_remaining: calls_remaining.toString(),
        amounts: amounts.toAmino(),
      },
    }
  }

  public static fromData(data: CombinedLimit.Data): CombinedLimit {
    const { calls_remaining, amounts } = data
    return new CombinedLimit(
      Number.parseInt(calls_remaining),
      Coins.fromData(amounts)
    )
  }

  public toData(): CombinedLimit.Data {
    const { calls_remaining, amounts } = this
    return {
      '@type': '/cosmwasm.wasm.v1.CombinedLimit',
      calls_remaining: calls_remaining.toString(),
      amounts: amounts.toData(),
    }
  }

  public static fromProto(data: CombinedLimit.Proto): CombinedLimit {
    return new CombinedLimit(
      data.callsRemaining.toNumber(),
      Coins.fromProto(data.amounts)
    )
  }

  public toProto(): CombinedLimit.Proto {
    const { calls_remaining, amounts } = this
    return CombinedLimit_pb.fromPartial({
      callsRemaining: Long.fromNumber(calls_remaining),
      amounts: amounts.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.CombinedLimit',
      value: CombinedLimit_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): CombinedLimit {
    return CombinedLimit.fromProto(CombinedLimit_pb.decode(msgAny.value))
  }
}

export namespace CombinedLimit {
  export interface Amino {
    type: 'wasm/CombinedLimit'
    value: {
      calls_remaining: string
      amounts: Coins.Amino
    }
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.CombinedLimit'
    calls_remaining: string
    amounts: Coins.Data
  }

  export type Proto = CombinedLimit_pb
}
