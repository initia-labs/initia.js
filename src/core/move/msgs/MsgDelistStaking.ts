import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgDelistStaking as MsgDelistStaking_pb } from '@initia/initia.proto/initia/move/v1/tx'

/**
 * MsgDelistStaking removes a DEX pair from the staking whitelist.
 */
export class MsgDelistStaking extends JSONSerializable<
  MsgDelistStaking.Amino,
  MsgDelistStaking.Data,
  MsgDelistStaking.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param metadata_lpthe LP metadata address of the DEX pair.
   */
  constructor(
    public authority: AccAddress,
    public metadata_lp: string
  ) {
    super()
  }

  public static fromAmino(data: MsgDelistStaking.Amino): MsgDelistStaking {
    const {
      value: { authority, metadata_lp },
    } = data

    return new MsgDelistStaking(authority, metadata_lp)
  }

  public toAmino(): MsgDelistStaking.Amino {
    const { authority, metadata_lp } = this

    return {
      type: 'move/MsgDelistStaking',
      value: {
        authority,
        metadata_lp,
      },
    }
  }

  public static fromData(data: MsgDelistStaking.Data): MsgDelistStaking {
    const { authority, metadata_lp } = data

    return new MsgDelistStaking(authority, metadata_lp)
  }

  public toData(): MsgDelistStaking.Data {
    const { authority, metadata_lp } = this

    return {
      '@type': '/initia.move.v1.MsgDelistStaking',
      authority,
      metadata_lp,
    }
  }

  public static fromProto(data: MsgDelistStaking.Proto): MsgDelistStaking {
    return new MsgDelistStaking(data.authority, data.metadataLp)
  }

  public toProto(): MsgDelistStaking.Proto {
    const { authority, metadata_lp } = this

    return MsgDelistStaking_pb.fromPartial({
      authority,
      metadataLp: metadata_lp,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.MsgDelistStaking',
      value: MsgDelistStaking_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgDelistStaking {
    return MsgDelistStaking.fromProto(MsgDelistStaking_pb.decode(msgAny.value))
  }
}

export namespace MsgDelistStaking {
  export interface Amino {
    type: 'move/MsgDelistStaking'
    value: {
      authority: AccAddress
      metadata_lp: string
    }
  }

  export interface Data {
    '@type': '/initia.move.v1.MsgDelistStaking'
    authority: AccAddress
    metadata_lp: string
  }

  export type Proto = MsgDelistStaking_pb
}
