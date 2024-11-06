import { JSONSerializable } from '../../util/json'
import { Denom } from '../Denom'
import { DenomUnit as DenomUnit_pb } from '@initia/initia.proto/cosmos/bank/v1beta1/bank'

export class DenomUnit extends JSONSerializable<
  DenomUnit.Amino,
  DenomUnit.Data,
  DenomUnit.Proto
> {
  /**
   * @param denom the string name of the given denom unit
   * @param exponent power of 10 exponent that one must raise the base_denom to in order to equal the given DenomUnit's denom
   * @param aliases list of string aliases for the given denom
   */
  constructor(
    public denom: Denom,
    public exponent: number,
    public aliases: string[]
  ) {
    super()
  }

  public static fromAmino(data: DenomUnit.Amino): DenomUnit {
    const { denom, exponent, aliases } = data
    return new DenomUnit(denom, parseInt(exponent), aliases)
  }

  public toAmino(): DenomUnit.Amino {
    const { denom, exponent, aliases } = this
    return {
      denom,
      exponent: exponent.toFixed(),
      aliases,
    }
  }

  public static fromData(data: DenomUnit.Data): DenomUnit {
    const { denom, exponent, aliases } = data
    return new DenomUnit(denom, parseInt(exponent), aliases)
  }

  public toData(): DenomUnit.Data {
    const { denom, exponent, aliases } = this
    return {
      denom,
      exponent: exponent.toFixed(),
      aliases,
    }
  }

  public static fromProto(data: DenomUnit.Proto): DenomUnit {
    return new DenomUnit(data.denom, data.exponent, data.aliases)
  }

  public toProto(): DenomUnit.Proto {
    const { denom, exponent, aliases } = this
    return DenomUnit_pb.fromPartial({
      denom,
      exponent,
      aliases,
    })
  }
}

export namespace DenomUnit {
  export interface Amino {
    denom: Denom
    exponent: string
    aliases: string[]
  }

  export interface Data {
    denom: Denom
    exponent: string
    aliases: string[]
  }

  export type Proto = DenomUnit_pb
}
