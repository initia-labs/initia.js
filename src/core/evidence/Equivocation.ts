import { JSONSerializable } from '../../util/json'
import { ValConsAddress } from '../bech32'
import { Equivocation as Equivocation_pb } from '@initia/initia.proto/cosmos/evidence/v1beta1/evidence'
import { Any } from '@initia/initia.proto/google/protobuf/any'

/**
 * Equivocation implements the Evidence interface and defines evidence of double signing misbehavior.
 */
export class Equivocation extends JSONSerializable<
  Equivocation.Amino,
  Equivocation.Data,
  Equivocation.Proto
> {
  /**
   * @param height the equivocation height
   * @param time the equivocation time
   * @param power the equivocation validator power
   * @param consensus_address the equivocation validator consensus address
   */
  constructor(
    public height: number,
    public time: Date,
    public power: number,
    public consensus_address: ValConsAddress
  ) {
    super()
  }

  public static fromAmino(data: Equivocation.Amino): Equivocation {
    const {
      value: { height, time, power, consensus_address },
    } = data

    return new Equivocation(
      parseInt(height),
      new Date(time),
      parseInt(power),
      consensus_address
    )
  }

  public toAmino(): Equivocation.Amino {
    const { height, time, power, consensus_address } = this

    return {
      type: 'cosmos-sdk/Equivocation',
      value: {
        height: height.toFixed(),
        time: time.toISOString(),
        power: power.toFixed(),
        consensus_address,
      },
    }
  }

  public static fromData(data: Equivocation.Data): Equivocation {
    const { height, time, power, consensus_address } = data

    return new Equivocation(
      parseInt(height),
      new Date(time),
      parseInt(power),
      consensus_address
    )
  }

  public toData(): Equivocation.Data {
    const { height, time, power, consensus_address } = this

    return {
      '@type': '/cosmos.evidence.v1beta1.Equivocation',
      height: height.toFixed(),
      time: time.toISOString(),
      power: power.toFixed(),
      consensus_address,
    }
  }

  public static fromProto(data: Equivocation.Proto): Equivocation {
    return new Equivocation(
      data.height.toNumber(),
      data.time as Date,
      data.power.toNumber(),
      data.consensusAddress
    )
  }

  public toProto(): Equivocation.Proto {
    const { height, time, power, consensus_address } = this

    return Equivocation_pb.fromPartial({
      height,
      time,
      power,
      consensusAddress: consensus_address,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.evidence.v1beta1.Equivocation',
      value: Equivocation_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): Equivocation {
    return Equivocation.fromProto(Equivocation_pb.decode(msgAny.value))
  }
}

export namespace Equivocation {
  export interface Amino {
    type: 'cosmos-sdk/Equivocation'
    value: {
      height: string
      time: string
      power: string
      consensus_address: ValConsAddress
    }
  }

  export interface Data {
    '@type': '/cosmos.evidence.v1beta1.Equivocation'
    height: string
    time: string
    power: string
    consensus_address: ValConsAddress
  }

  export type Proto = Equivocation_pb
}
