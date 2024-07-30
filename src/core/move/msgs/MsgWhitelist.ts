import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgWhitelist as MsgWhitelist_pb } from '@initia/initia.proto/initia/move/v1/tx'

export class MsgWhitelist extends JSONSerializable<
  MsgWhitelist.Amino,
  MsgWhitelist.Data,
  MsgWhitelist.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param metadata_lp Dex coin LP metadata address
   * @param reward_weight registered to distribution's Params
   */
  constructor(
    public authority: AccAddress,
    public metadata_lp: string,
    public reward_weight: string
  ) {
    super()
  }

  public static fromAmino(data: MsgWhitelist.Amino): MsgWhitelist {
    const {
      value: { authority, metadata_lp, reward_weight },
    } = data

    return new MsgWhitelist(authority, metadata_lp, reward_weight)
  }

  public toAmino(): MsgWhitelist.Amino {
    const { authority, metadata_lp, reward_weight } = this

    return {
      type: 'move/MsgWhitelist',
      value: {
        authority,
        metadata_lp,
        reward_weight,
      },
    }
  }

  public static fromData(data: MsgWhitelist.Data): MsgWhitelist {
    const { authority, metadata_lp, reward_weight } = data

    return new MsgWhitelist(authority, metadata_lp, reward_weight)
  }

  public toData(): MsgWhitelist.Data {
    const { authority, metadata_lp, reward_weight } = this

    return {
      '@type': '/initia.move.v1.MsgWhitelist',
      authority,
      metadata_lp,
      reward_weight,
    }
  }

  public static fromProto(data: MsgWhitelist.Proto): MsgWhitelist {
    return new MsgWhitelist(data.authority, data.metadataLp, data.rewardWeight)
  }

  public toProto(): MsgWhitelist.Proto {
    const { authority, metadata_lp, reward_weight } = this

    return MsgWhitelist_pb.fromPartial({
      authority,
      metadataLp: metadata_lp,
      rewardWeight: reward_weight,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.MsgWhitelist',
      value: MsgWhitelist_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgWhitelist {
    return MsgWhitelist.fromProto(MsgWhitelist_pb.decode(msgAny.value))
  }
}

export namespace MsgWhitelist {
  export interface Amino {
    type: 'move/MsgWhitelist'
    value: {
      authority: AccAddress
      metadata_lp: string
      reward_weight: string
    }
  }

  export interface Data {
    '@type': '/initia.move.v1.MsgWhitelist'
    authority: AccAddress
    metadata_lp: string
    reward_weight: string
  }

  export type Proto = MsgWhitelist_pb
}
