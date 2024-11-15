import { JSONSerializable } from '../../util/json'
import { Output as Output_pb } from '@initia/opinit.proto/opinit/ophost/v1/types'

/**
 * Output is a l2 block submitted by proposer.
 */
export class Output extends JSONSerializable<
  Output.Amino,
  Output.Data,
  Output.Proto
> {
  /**
   * @param output_root hash of the l2 output
   * @param l1_block_number the l1 block number that the output root was submitted in
   * @param l1_block_time timestamp of the l1 block that the output root was submitted in
   * @param l2_block_number the l2 block number that the output root was submitted in
   */
  constructor(
    public output_root: string,
    public l1_block_number: number,
    public l1_block_time: Date,
    public l2_block_number: number
  ) {
    super()
  }

  public static fromAmino(data: Output.Amino): Output {
    const { output_root, l1_block_number, l1_block_time, l2_block_number } =
      data
    return new Output(
      output_root,
      parseInt(l1_block_number),
      new Date(l1_block_time),
      parseInt(l2_block_number)
    )
  }

  public toAmino(): Output.Amino {
    const { output_root, l1_block_number, l1_block_time, l2_block_number } =
      this
    return {
      output_root,
      l1_block_number: l1_block_number.toFixed(),
      l1_block_time: l1_block_time.toISOString(),
      l2_block_number: l2_block_number.toFixed(),
    }
  }

  public static fromData(data: Output.Data): Output {
    const { output_root, l1_block_number, l1_block_time, l2_block_number } =
      data
    return new Output(
      output_root,
      parseInt(l1_block_number),
      new Date(l1_block_time),
      parseInt(l2_block_number)
    )
  }

  public toData(): Output.Data {
    const { output_root, l1_block_number, l1_block_time, l2_block_number } =
      this
    return {
      output_root,
      l1_block_number: l1_block_number.toFixed(),
      l1_block_time: l1_block_time.toISOString(),
      l2_block_number: l2_block_number.toFixed(),
    }
  }

  public static fromProto(data: Output.Proto): Output {
    return new Output(
      Buffer.from(data.outputRoot).toString('base64'),
      Number(data.l1BlockNumber),
      data.l1BlockTime as Date,
      Number(data.l2BlockNumber)
    )
  }

  public toProto(): Output.Proto {
    const { output_root, l1_block_number, l1_block_time, l2_block_number } =
      this
    return Output_pb.fromPartial({
      outputRoot: Buffer.from(output_root, 'base64'),
      l1BlockNumber: BigInt(l1_block_number),
      l1BlockTime: l1_block_time,
      l2BlockNumber: BigInt(l2_block_number),
    })
  }
}

export namespace Output {
  export interface Amino {
    output_root: string
    l1_block_number: string
    l1_block_time: string
    l2_block_number: string
  }

  export interface Data {
    output_root: string
    l1_block_number: string
    l1_block_time: string
    l2_block_number: string
  }

  export type Proto = Output_pb
}
