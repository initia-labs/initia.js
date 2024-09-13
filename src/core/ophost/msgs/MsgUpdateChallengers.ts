import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { MsgUpdateChallengers as MsgUpdateChallengers_pb } from '@initia/opinit.proto/opinit/ophost/v1/tx'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import Long from 'long'

export class MsgUpdateChallengers extends JSONSerializable<
  MsgUpdateChallengers.Amino,
  MsgUpdateChallengers.Data,
  MsgUpdateChallengers.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param bridge_id
   * @param new_challengers
   */
  constructor(
    public authority: AccAddress,
    public bridge_id: number,
    public new_challengers: AccAddress[]
  ) {
    super()
  }

  public static fromAmino(
    data: MsgUpdateChallengers.Amino
  ): MsgUpdateChallengers {
    const {
      value: { authority, bridge_id, new_challengers },
    } = data

    return new MsgUpdateChallengers(
      authority,
      Number.parseInt(bridge_id),
      new_challengers
    )
  }

  public toAmino(): MsgUpdateChallengers.Amino {
    const { authority, bridge_id, new_challengers } = this
    return {
      type: 'ophost/MsgUpdateChallengers',
      value: {
        authority,
        bridge_id: bridge_id.toString(),
        new_challengers,
      },
    }
  }

  public static fromData(
    data: MsgUpdateChallengers.Data
  ): MsgUpdateChallengers {
    const { authority, bridge_id, new_challengers } = data
    return new MsgUpdateChallengers(
      authority,
      Number.parseInt(bridge_id),
      new_challengers
    )
  }

  public toData(): MsgUpdateChallengers.Data {
    const { authority, bridge_id, new_challengers } = this
    return {
      '@type': '/opinit.ophost.v1.MsgUpdateChallengers',
      authority,
      bridge_id: bridge_id.toString(),
      new_challengers,
    }
  }

  public static fromProto(
    data: MsgUpdateChallengers.Proto
  ): MsgUpdateChallengers {
    return new MsgUpdateChallengers(
      data.authority,
      data.bridgeId.toNumber(),
      data.newChallengers
    )
  }

  public toProto(): MsgUpdateChallengers.Proto {
    const { authority, bridge_id, new_challengers } = this
    return MsgUpdateChallengers_pb.fromPartial({
      authority,
      bridgeId: Long.fromNumber(bridge_id),
      newChallengers: new_challengers,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.ophost.v1.MsgUpdateChallengers',
      value: MsgUpdateChallengers_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateChallengers {
    return MsgUpdateChallengers.fromProto(
      MsgUpdateChallengers_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateChallengers {
  export interface Amino {
    type: 'ophost/MsgUpdateChallengers'
    value: {
      authority: AccAddress
      bridge_id: string
      new_challengers: AccAddress[]
    }
  }

  export interface Data {
    '@type': '/opinit.ophost.v1.MsgUpdateChallengers'
    authority: AccAddress
    bridge_id: string
    new_challengers: AccAddress[]
  }

  export type Proto = MsgUpdateChallengers_pb
}
