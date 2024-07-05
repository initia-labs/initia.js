import { JSONSerializable } from '../../util/json'
import { BlockParams as BlockParams_pb } from '@initia/initia.proto/tendermint/types/params'
import Long from 'long'

export class BlockParams extends JSONSerializable<
  BlockParams.Amino,
  BlockParams.Data,
  BlockParams.Proto
> {
  /**
   * @param max_bytes Max block size in bytes, must be greater than 0
   * @param max_gas Max gas per block, must be greater or equal to -1
   */
  constructor(
    public max_bytes: number,
    public max_gas: number
  ) {
    super()
  }

  public static fromAmino(data: BlockParams.Amino): BlockParams {
    const { max_bytes, max_gas } = data
    return new BlockParams(Number.parseInt(max_bytes), Number.parseInt(max_gas))
  }

  public toAmino(): BlockParams.Amino {
    const { max_bytes, max_gas } = this
    return {
      max_bytes: max_bytes.toString(),
      max_gas: max_gas.toString(),
    }
  }

  public static fromData(data: BlockParams.Data): BlockParams {
    const { max_bytes, max_gas } = data
    return new BlockParams(Number.parseInt(max_bytes), Number.parseInt(max_gas))
  }

  public toData(): BlockParams.Data {
    const { max_bytes, max_gas } = this
    return {
      max_bytes: max_bytes.toString(),
      max_gas: max_gas.toString(),
    }
  }

  public static fromProto(data: BlockParams.Proto): BlockParams {
    return new BlockParams(data.maxBytes.toNumber(), data.maxGas.toNumber())
  }

  public toProto(): BlockParams.Proto {
    const { max_bytes, max_gas } = this
    return BlockParams_pb.fromPartial({
      maxBytes: Long.fromNumber(max_bytes),
      maxGas: Long.fromNumber(max_gas),
    })
  }
}

export namespace BlockParams {
  export interface Amino {
    max_bytes: string
    max_gas: string
  }

  export interface Data {
    max_bytes: string
    max_gas: string
  }

  export type Proto = BlockParams_pb
}
