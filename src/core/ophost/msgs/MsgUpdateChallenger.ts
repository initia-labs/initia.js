import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { MsgUpdateChallenger as MsgUpdateChallenger_pb } from '@initia/opinit.proto/opinit/ophost/v1/tx'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import Long from 'long'

export class MsgUpdateChallenger extends JSONSerializable<
  MsgUpdateChallenger.Amino,
  MsgUpdateChallenger.Data,
  MsgUpdateChallenger.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param bridge_id
   * @param new_challenger
   */
  constructor(
    public authority: AccAddress,
    public bridge_id: number,
    public new_challenger: AccAddress
  ) {
    super()
  }

  public static fromAmino(
    data: MsgUpdateChallenger.Amino
  ): MsgUpdateChallenger {
    const {
      value: { authority, bridge_id, new_challenger },
    } = data

    return new MsgUpdateChallenger(
      authority,
      Number.parseInt(bridge_id),
      new_challenger
    )
  }

  public toAmino(): MsgUpdateChallenger.Amino {
    const { authority, bridge_id, new_challenger } = this
    return {
      type: 'ophost/MsgUpdateChallenger',
      value: {
        authority,
        bridge_id: bridge_id.toString(),
        new_challenger,
      },
    }
  }

  public static fromData(data: MsgUpdateChallenger.Data): MsgUpdateChallenger {
    const { authority, bridge_id, new_challenger } = data
    return new MsgUpdateChallenger(
      authority,
      Number.parseInt(bridge_id),
      new_challenger
    )
  }

  public toData(): MsgUpdateChallenger.Data {
    const { authority, bridge_id, new_challenger } = this
    return {
      '@type': '/opinit.ophost.v1.MsgUpdateChallenger',
      authority,
      bridge_id: bridge_id.toString(),
      new_challenger,
    }
  }

  public static fromProto(
    data: MsgUpdateChallenger.Proto
  ): MsgUpdateChallenger {
    return new MsgUpdateChallenger(
      data.authority,
      data.bridgeId.toNumber(),
      data.newChallenger
    )
  }

  public toProto(): MsgUpdateChallenger.Proto {
    const { authority, bridge_id, new_challenger } = this
    return MsgUpdateChallenger_pb.fromPartial({
      authority,
      bridgeId: Long.fromNumber(bridge_id),
      newChallenger: new_challenger,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.ophost.v1.MsgUpdateChallenger',
      value: MsgUpdateChallenger_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateChallenger {
    return MsgUpdateChallenger.fromProto(
      MsgUpdateChallenger_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateChallenger {
  export interface Amino {
    type: 'ophost/MsgUpdateChallenger'
    value: {
      authority: AccAddress
      bridge_id: string
      new_challenger: AccAddress
    }
  }

  export interface Data {
    '@type': '/opinit.ophost.v1.MsgUpdateChallenger'
    authority: AccAddress
    bridge_id: string
    new_challenger: AccAddress
  }

  export type Proto = MsgUpdateChallenger_pb
}
