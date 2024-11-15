import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { MsgUpdateProposer as MsgUpdateProposer_pb } from '@initia/opinit.proto/opinit/ophost/v1/tx'
import { Any } from '@initia/initia.proto/google/protobuf/any'

/**
 * MsgUpdateProposer is a message to change a proposer.
 */
export class MsgUpdateProposer extends JSONSerializable<
  MsgUpdateProposer.Amino,
  MsgUpdateProposer.Data,
  MsgUpdateProposer.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param bridge_id
   * @param new_proposer
   */
  constructor(
    public authority: AccAddress,
    public bridge_id: number,
    public new_proposer: AccAddress
  ) {
    super()
  }

  public static fromAmino(data: MsgUpdateProposer.Amino): MsgUpdateProposer {
    const {
      value: { authority, bridge_id, new_proposer },
    } = data

    return new MsgUpdateProposer(authority, parseInt(bridge_id), new_proposer)
  }

  public toAmino(): MsgUpdateProposer.Amino {
    const { authority, bridge_id, new_proposer } = this
    return {
      type: 'ophost/MsgUpdateProposer',
      value: {
        authority,
        bridge_id: bridge_id.toFixed(),
        new_proposer,
      },
    }
  }

  public static fromData(data: MsgUpdateProposer.Data): MsgUpdateProposer {
    const { authority, bridge_id, new_proposer } = data
    return new MsgUpdateProposer(authority, parseInt(bridge_id), new_proposer)
  }

  public toData(): MsgUpdateProposer.Data {
    const { authority, bridge_id, new_proposer } = this
    return {
      '@type': '/opinit.ophost.v1.MsgUpdateProposer',
      authority,
      bridge_id: bridge_id.toFixed(),
      new_proposer,
    }
  }

  public static fromProto(data: MsgUpdateProposer.Proto): MsgUpdateProposer {
    return new MsgUpdateProposer(
      data.authority,
      Number(data.bridgeId),
      data.newProposer
    )
  }

  public toProto(): MsgUpdateProposer.Proto {
    const { authority, bridge_id, new_proposer } = this
    return MsgUpdateProposer_pb.fromPartial({
      authority,
      bridgeId: BigInt(bridge_id),
      newProposer: new_proposer,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.ophost.v1.MsgUpdateProposer',
      value: MsgUpdateProposer_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateProposer {
    return MsgUpdateProposer.fromProto(
      MsgUpdateProposer_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateProposer {
  export interface Amino {
    type: 'ophost/MsgUpdateProposer'
    value: {
      authority: AccAddress
      bridge_id: string
      new_proposer: AccAddress
    }
  }

  export interface Data {
    '@type': '/opinit.ophost.v1.MsgUpdateProposer'
    authority: AccAddress
    bridge_id: string
    new_proposer: AccAddress
  }

  export type Proto = MsgUpdateProposer_pb
}
