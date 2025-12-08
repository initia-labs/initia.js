import { JSONSerializable } from '../../../util/json'
import { AccAddress, ValAddress } from '../../bech32'
import { ValConsPublicKey } from '../../PublicKey'
import { MsgUpdateSequencer as MsgUpdateSequencer_pb } from '@initia/opinit.proto/opinit/opchild/v1/tx'
import { Any } from '@initia/initia.proto/google/protobuf/any'

/**
 * MsgUpdateSequencer is a message to update the sequencer role in validator set by removing the old sequencer and adding a new one.
 */
export class MsgUpdateSequencer extends JSONSerializable<
  MsgUpdateSequencer.Amino,
  MsgUpdateSequencer.Data,
  MsgUpdateSequencer.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param moniker
   * @param sequencer_address
   * @param pubkey
   */
  constructor(
    public authority: AccAddress,
    public moniker: string,
    public sequencer_address: ValAddress,
    public pubkey: ValConsPublicKey
  ) {
    super()
  }

  public static fromAmino(data: MsgUpdateSequencer.Amino): MsgUpdateSequencer {
    const {
      value: { authority, moniker, sequencer_address, pubkey },
    } = data

    return new MsgUpdateSequencer(
      authority,
      moniker,
      sequencer_address,
      ValConsPublicKey.fromAmino(pubkey)
    )
  }

  public toAmino(): MsgUpdateSequencer.Amino {
    const { authority, moniker, sequencer_address, pubkey } = this
    return {
      type: 'opchild/MsgUpdateSequencer',
      value: {
        authority,
        moniker,
        sequencer_address,
        pubkey: pubkey.toAmino(),
      },
    }
  }

  public static fromData(data: MsgUpdateSequencer.Data): MsgUpdateSequencer {
    const { authority, moniker, sequencer_address, pubkey } = data
    return new MsgUpdateSequencer(
      authority,
      moniker,
      sequencer_address,
      ValConsPublicKey.fromData(pubkey)
    )
  }

  public toData(): MsgUpdateSequencer.Data {
    const { authority, moniker, sequencer_address, pubkey } = this
    return {
      '@type': '/opinit.opchild.v1.MsgUpdateSequencer',
      authority,
      moniker,
      sequencer_address,
      pubkey: pubkey.toData(),
    }
  }

  public static fromProto(data: MsgUpdateSequencer.Proto): MsgUpdateSequencer {
    return new MsgUpdateSequencer(
      data.authority,
      data.moniker,
      data.sequencerAddress,
      ValConsPublicKey.unpackAny(data.pubkey as Any)
    )
  }

  public toProto(): MsgUpdateSequencer.Proto {
    const { authority, moniker, sequencer_address, pubkey } = this
    return MsgUpdateSequencer_pb.fromPartial({
      authority,
      moniker,
      sequencerAddress: sequencer_address,
      pubkey: pubkey.packAny(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.opchild.v1.MsgUpdateSequencer',
      value: MsgUpdateSequencer_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateSequencer {
    return MsgUpdateSequencer.fromProto(
      MsgUpdateSequencer_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateSequencer {
  export interface Amino {
    type: 'opchild/MsgUpdateSequencer'
    value: {
      authority: AccAddress
      moniker: string
      sequencer_address: ValAddress
      pubkey: ValConsPublicKey.Amino
    }
  }

  export interface Data {
    '@type': '/opinit.opchild.v1.MsgUpdateSequencer'
    authority: AccAddress
    moniker: string
    sequencer_address: ValAddress
    pubkey: ValConsPublicKey.Data
  }

  export type Proto = MsgUpdateSequencer_pb
}
