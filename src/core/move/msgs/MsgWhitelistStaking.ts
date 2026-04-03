import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { num } from '../../num'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgWhitelistStaking as MsgWhitelistStaking_pb } from '@initia/initia.proto/initia/move/v1/tx'

/**
 * MsgWhitelistStaking registers a DEX pair in the staking whitelist.
 */
export class MsgWhitelistStaking extends JSONSerializable<
  MsgWhitelistStaking.Amino,
  MsgWhitelistStaking.Data,
  MsgWhitelistStaking.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param metadata_lp the LP metadata address of the DEX pair
   * @param reward_weight registered to distribution's Params
   */
  constructor(
    public authority: AccAddress,
    public metadata_lp: string,
    public reward_weight: string
  ) {
    super()
  }

  public static fromAmino(
    data: MsgWhitelistStaking.Amino
  ): MsgWhitelistStaking {
    const {
      value: { authority, metadata_lp, reward_weight },
    } = data

    return new MsgWhitelistStaking(authority, metadata_lp, reward_weight)
  }

  public toAmino(): MsgWhitelistStaking.Amino {
    const { authority, metadata_lp, reward_weight } = this

    return {
      type: 'move/MsgWhitelistStaking',
      value: {
        authority,
        metadata_lp,
        reward_weight: num(reward_weight).toFixed(18),
      },
    }
  }

  public static fromData(data: MsgWhitelistStaking.Data): MsgWhitelistStaking {
    const { authority, metadata_lp, reward_weight } = data

    return new MsgWhitelistStaking(authority, metadata_lp, reward_weight)
  }

  public toData(): MsgWhitelistStaking.Data {
    const { authority, metadata_lp, reward_weight } = this

    return {
      '@type': '/initia.move.v1.MsgWhitelistStaking',
      authority,
      metadata_lp,
      reward_weight,
    }
  }

  public static fromProto(
    data: MsgWhitelistStaking.Proto
  ): MsgWhitelistStaking {
    return new MsgWhitelistStaking(
      data.authority,
      data.metadataLp,
      num(data.rewardWeight).shiftedBy(-18).toFixed()
    )
  }

  public toProto(): MsgWhitelistStaking.Proto {
    const { authority, metadata_lp, reward_weight } = this

    return MsgWhitelistStaking_pb.fromPartial({
      authority,
      metadataLp: metadata_lp,
      rewardWeight: num(reward_weight).shiftedBy(18).toFixed(0),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.MsgWhitelistStaking',
      value: MsgWhitelistStaking_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgWhitelistStaking {
    return MsgWhitelistStaking.fromProto(
      MsgWhitelistStaking_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgWhitelistStaking {
  export interface Amino {
    type: 'move/MsgWhitelistStaking'
    value: {
      authority: AccAddress
      metadata_lp: string
      reward_weight: string
    }
  }

  export interface Data {
    '@type': '/initia.move.v1.MsgWhitelistStaking'
    authority: AccAddress
    metadata_lp: string
    reward_weight: string
  }

  export type Proto = MsgWhitelistStaking_pb
}
