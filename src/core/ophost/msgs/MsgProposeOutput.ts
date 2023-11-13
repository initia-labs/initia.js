import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { MsgProposeOutput as MsgProposeOutput_pb } from '@initia/opinit.proto/opinit/ophost/v1/tx';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import Long from 'long';

export class MsgProposeOutput extends JSONSerializable<
  MsgProposeOutput.Amino,
  MsgProposeOutput.Data,
  MsgProposeOutput.Proto
> {
  /**
   * @param proposer
   * @param bridge_id
   * @param l2_block_number
   * @param output_root
   */
  constructor(
    public proposer: AccAddress,
    public bridge_id: number,
    public l2_block_number: number,
    public output_root: Buffer
  ) {
    super();
  }

  public static fromAmino(data: MsgProposeOutput.Amino): MsgProposeOutput {
    const {
      value: { proposer, bridge_id, l2_block_number, output_root },
    } = data;
    return new MsgProposeOutput(
      proposer,
      Number.parseInt(bridge_id),
      Number.parseInt(l2_block_number),
      Buffer.from(output_root)
    );
  }

  public toAmino(): MsgProposeOutput.Amino {
    const { proposer, bridge_id, l2_block_number, output_root } = this;
    return {
      type: 'ophost/MsgProposeOutput',
      value: {
        proposer,
        bridge_id: bridge_id.toString(),
        l2_block_number: l2_block_number.toString(),
        output_root: output_root.toJSON().data,
      },
    };
  }

  public static fromData(data: MsgProposeOutput.Data): MsgProposeOutput {
    const { proposer, bridge_id, l2_block_number, output_root } = data;
    return new MsgProposeOutput(
      proposer,
      Number.parseInt(bridge_id),
      Number.parseInt(l2_block_number),
      Buffer.from(output_root)
    );
  }

  public toData(): MsgProposeOutput.Data {
    const { proposer, bridge_id, l2_block_number, output_root } = this;
    return {
      '@type': '/opinit.ophost.v1.MsgProposeOutput',
      proposer,
      bridge_id: bridge_id.toString(),
      l2_block_number: l2_block_number.toString(),
      output_root: output_root.toJSON().data,
    };
  }

  public static fromProto(data: MsgProposeOutput.Proto): MsgProposeOutput {
    return new MsgProposeOutput(
      data.proposer,
      data.bridgeId.toNumber(),
      data.l2BlockNumber.toNumber(),
      Buffer.from(data.outputRoot)
    );
  }

  public toProto(): MsgProposeOutput.Proto {
    const { proposer, bridge_id, l2_block_number, output_root } = this;
    return MsgProposeOutput_pb.fromPartial({
      proposer,
      bridgeId: Long.fromNumber(bridge_id),
      l2BlockNumber: Long.fromNumber(l2_block_number),
      outputRoot: output_root,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.ophost.v1.MsgProposeOutput',
      value: MsgProposeOutput_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgProposeOutput {
    return MsgProposeOutput.fromProto(MsgProposeOutput_pb.decode(msgAny.value));
  }
}

export namespace MsgProposeOutput {
  export interface Amino {
    type: 'ophost/MsgProposeOutput';
    value: {
      proposer: AccAddress;
      bridge_id: string;
      l2_block_number: string;
      output_root: number[];
    };
  }

  export interface Data {
    '@type': '/opinit.ophost.v1.MsgProposeOutput';
    proposer: AccAddress;
    bridge_id: string;
    l2_block_number: string;
    output_root: number[];
  }

  export type Proto = MsgProposeOutput_pb;
}
