import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { MsgDeleteOutput as MsgDeleteOutput_pb } from '@initia/opinit.proto/opinit/ophost/v1/tx'
import { Any } from '@initia/initia.proto/google/protobuf/any'

export class MsgDeleteOutput extends JSONSerializable<
  MsgDeleteOutput.Amino,
  MsgDeleteOutput.Data,
  MsgDeleteOutput.Proto
> {
  /**
   * @param challenger
   * @param bridge_id
   * @param output_index
   */
  constructor(
    public challenger: AccAddress,
    public bridge_id: number,
    public output_index: number
  ) {
    super()
  }

  public static fromAmino(data: MsgDeleteOutput.Amino): MsgDeleteOutput {
    const {
      value: { challenger, bridge_id, output_index },
    } = data
    return new MsgDeleteOutput(
      challenger,
      parseInt(bridge_id),
      parseInt(output_index)
    )
  }

  public toAmino(): MsgDeleteOutput.Amino {
    const { challenger, bridge_id, output_index } = this
    return {
      type: 'ophost/MsgDeleteOutput',
      value: {
        challenger,
        bridge_id: bridge_id.toFixed(),
        output_index: output_index.toFixed(),
      },
    }
  }

  public static fromData(data: MsgDeleteOutput.Data): MsgDeleteOutput {
    const { challenger, bridge_id, output_index } = data
    return new MsgDeleteOutput(
      challenger,
      parseInt(bridge_id),
      parseInt(output_index)
    )
  }

  public toData(): MsgDeleteOutput.Data {
    const { challenger, bridge_id, output_index } = this
    return {
      '@type': '/opinit.ophost.v1.MsgDeleteOutput',
      challenger,
      bridge_id: bridge_id.toFixed(),
      output_index: output_index.toFixed(),
    }
  }

  public static fromProto(data: MsgDeleteOutput.Proto): MsgDeleteOutput {
    return new MsgDeleteOutput(
      data.challenger,
      data.bridgeId.toNumber(),
      data.outputIndex.toNumber()
    )
  }

  public toProto(): MsgDeleteOutput.Proto {
    const { challenger, bridge_id, output_index } = this
    return MsgDeleteOutput_pb.fromPartial({
      challenger,
      bridgeId: bridge_id,
      outputIndex: output_index,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.ophost.v1.MsgDeleteOutput',
      value: MsgDeleteOutput_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgDeleteOutput {
    return MsgDeleteOutput.fromProto(MsgDeleteOutput_pb.decode(msgAny.value))
  }
}

export namespace MsgDeleteOutput {
  export interface Amino {
    type: 'ophost/MsgDeleteOutput'
    value: {
      challenger: AccAddress
      bridge_id: string
      output_index: string
    }
  }

  export interface Data {
    '@type': '/opinit.ophost.v1.MsgDeleteOutput'
    challenger: AccAddress
    bridge_id: string
    output_index: string
  }

  export type Proto = MsgDeleteOutput_pb
}
