import { JSONSerializable } from '../../util/json'
import { ValConsAddress } from '../bech32'
import { ValidatorSigningInfo as ValidatorSigningInfo_pb } from '@initia/initia.proto/cosmos/slashing/v1beta1/slashing'

/**
 * ValidatorSigningInfo defines a validator's signing info for monitoring their liveness activity.
 */
export class ValidatorSigningInfo extends JSONSerializable<
  ValidatorSigningInfo.Amino,
  ValidatorSigningInfo.Data,
  ValidatorSigningInfo.Proto
> {
  /**
   * @param address
   * @param start_height height at which validator was first a candidate OR was un-jailed
   * @param index_offset index which is incremented every time a validator is bonded in a block
   * @param jailed_until timestamp until which the validator is jailed due to liveness downtime
   * @param tombstoned whether or not a validator has been tombstoned
   * @param missed_blocks_counter a counter of missed (unsigned) blocks
   */
  constructor(
    public address: ValConsAddress,
    public start_height: number,
    public index_offset: number,
    public jailed_until: Date,
    public tombstoned: boolean,
    public missed_blocks_counter: number
  ) {
    super()
  }

  public static fromAmino(
    data: ValidatorSigningInfo.Amino
  ): ValidatorSigningInfo {
    const {
      address,
      start_height,
      index_offset,
      jailed_until,
      tombstoned,
      missed_blocks_counter,
    } = data

    return new ValidatorSigningInfo(
      address,
      parseInt(start_height),
      parseInt(index_offset),
      new Date(jailed_until),
      tombstoned,
      parseInt(missed_blocks_counter)
    )
  }

  public toAmino(): ValidatorSigningInfo.Amino {
    const {
      address,
      start_height,
      index_offset,
      jailed_until,
      tombstoned,
      missed_blocks_counter,
    } = this

    return {
      address,
      start_height: start_height.toFixed(),
      index_offset: index_offset.toFixed(),
      jailed_until: jailed_until.toISOString(),
      tombstoned,
      missed_blocks_counter: missed_blocks_counter.toFixed(),
    }
  }

  public static fromData(
    data: ValidatorSigningInfo.Data
  ): ValidatorSigningInfo {
    const {
      address,
      start_height,
      index_offset,
      jailed_until,
      tombstoned,
      missed_blocks_counter,
    } = data

    return new ValidatorSigningInfo(
      address,
      parseInt(start_height),
      parseInt(index_offset),
      new Date(jailed_until),
      tombstoned,
      parseInt(missed_blocks_counter)
    )
  }

  public toData(): ValidatorSigningInfo.Data {
    const {
      address,
      start_height,
      index_offset,
      jailed_until,
      tombstoned,
      missed_blocks_counter,
    } = this

    return {
      address,
      start_height: start_height.toFixed(),
      index_offset: index_offset.toFixed(),
      jailed_until: jailed_until.toISOString(),
      tombstoned,
      missed_blocks_counter: missed_blocks_counter.toFixed(),
    }
  }

  public static fromProto(
    data: ValidatorSigningInfo.Proto
  ): ValidatorSigningInfo {
    return new ValidatorSigningInfo(
      data.address,
      Number(data.startHeight),
      Number(data.indexOffset),
      data.jailedUntil as Date,
      data.tombstoned,
      Number(data.missedBlocksCounter)
    )
  }

  public toProto(): ValidatorSigningInfo.Proto {
    const {
      address,
      start_height,
      index_offset,
      jailed_until,
      tombstoned,
      missed_blocks_counter,
    } = this

    return ValidatorSigningInfo_pb.fromPartial({
      address,
      startHeight: BigInt(start_height),
      indexOffset: BigInt(index_offset),
      jailedUntil: jailed_until,
      tombstoned,
      missedBlocksCounter: BigInt(missed_blocks_counter),
    })
  }
}

export namespace ValidatorSigningInfo {
  export interface Amino {
    address: ValConsAddress
    start_height: string
    index_offset: string
    jailed_until: string
    tombstoned: boolean
    missed_blocks_counter: string
  }

  export interface Data {
    address: ValConsAddress
    start_height: string
    index_offset: string
    jailed_until: string
    tombstoned: boolean
    missed_blocks_counter: string
  }

  export type Proto = ValidatorSigningInfo_pb
}
