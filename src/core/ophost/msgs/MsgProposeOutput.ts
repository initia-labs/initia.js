import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { MsgProposeOutput as MsgProposeOutput_pb } from '@initia/opinit.proto/opinit/ophost/v1/tx'
import { Any } from '@initia/initia.proto/google/protobuf/any'

/**
 * MsgProposeOutput is a message to submit l2 block proposal.
 */
export class MsgProposeOutput extends JSONSerializable<
  MsgProposeOutput.Amino,
  MsgProposeOutput.Data,
  MsgProposeOutput.Proto
> {
  /**
   * @param proposer
   * @param bridge_id
   * @param output_index
   * @param l2_block_number
   * @param output_root
   */
  constructor(
    public proposer: AccAddress,
    public bridge_id: number,
    public output_index: number,
    public l2_block_number: number,
    public output_root: string
  ) {
    super()
  }

  public static fromAmino(data: MsgProposeOutput.Amino): MsgProposeOutput {
    const {
      value: {
        proposer,
        bridge_id,
        output_index,
        l2_block_number,
        output_root,
      },
    } = data
    return new MsgProposeOutput(
      proposer,
      parseInt(bridge_id),
      parseInt(output_index),
      parseInt(l2_block_number),
      output_root
    )
  }

  public toAmino(): MsgProposeOutput.Amino {
    const { proposer, bridge_id, output_index, l2_block_number, output_root } =
      this
    return {
      type: 'ophost/MsgProposeOutput',
      value: {
        proposer,
        bridge_id: bridge_id.toFixed(),
        output_index: output_index.toFixed(),
        l2_block_number: l2_block_number.toFixed(),
        output_root,
      },
    }
  }

  public static fromData(data: MsgProposeOutput.Data): MsgProposeOutput {
    const { proposer, bridge_id, output_index, l2_block_number, output_root } =
      data
    return new MsgProposeOutput(
      proposer,
      parseInt(bridge_id),
      parseInt(output_index),
      parseInt(l2_block_number),
      output_root
    )
  }

  public toData(): MsgProposeOutput.Data {
    const { proposer, bridge_id, output_index, l2_block_number, output_root } =
      this
    return {
      '@type': '/opinit.ophost.v1.MsgProposeOutput',
      proposer,
      bridge_id: bridge_id.toFixed(),
      output_index: output_index.toFixed(),
      l2_block_number: l2_block_number.toFixed(),
      output_root,
    }
  }

  public static fromProto(data: MsgProposeOutput.Proto): MsgProposeOutput {
    return new MsgProposeOutput(
      data.proposer,
      data.bridgeId.toNumber(),
      data.outputIndex.toNumber(),
      data.l2BlockNumber.toNumber(),
      Buffer.from(data.outputRoot).toString('base64')
    )
  }

  public toProto(): MsgProposeOutput.Proto {
    const { proposer, bridge_id, output_index, l2_block_number, output_root } =
      this
    return MsgProposeOutput_pb.fromPartial({
      proposer,
      bridgeId: bridge_id,
      outputIndex: output_index,
      l2BlockNumber: l2_block_number,
      outputRoot: output_root ? Buffer.from(output_root, 'base64') : undefined,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.ophost.v1.MsgProposeOutput',
      value: MsgProposeOutput_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgProposeOutput {
    return MsgProposeOutput.fromProto(MsgProposeOutput_pb.decode(msgAny.value))
  }
}

export namespace MsgProposeOutput {
  export interface Amino {
    type: 'ophost/MsgProposeOutput'
    value: {
      proposer: AccAddress
      bridge_id: string
      output_index: string
      l2_block_number: string
      output_root: string
    }
  }

  export interface Data {
    '@type': '/opinit.ophost.v1.MsgProposeOutput'
    proposer: AccAddress
    bridge_id: string
    output_index: string
    l2_block_number: string
    output_root: string
  }

  export type Proto = MsgProposeOutput_pb
}
