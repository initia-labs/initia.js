import { Coins } from '../../Coins'
import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgFundCommunityPool as MsgFundCommunityPool_pb } from '@initia/initia.proto/initia/reward/v1/tx'

/**
 * MsgFundCommunityPoolReward defines an operation for funding the community pool.
 */
export class MsgFundCommunityPoolReward extends JSONSerializable<
  MsgFundCommunityPoolReward.Amino,
  MsgFundCommunityPoolReward.Data,
  MsgFundCommunityPoolReward.Proto
> {
  public amount: Coins
  /**
   * @param authority the address that controls the module
   * @param amount the amount of reward to fund the community pool
   */
  constructor(
    public authority: AccAddress,
    amount: Coins.Input
  ) {
    super()
    this.amount = new Coins(amount)
  }

  public static fromAmino(
    data: MsgFundCommunityPoolReward.Amino
  ): MsgFundCommunityPoolReward {
    const {
      value: { authority, amount },
    } = data
    return new MsgFundCommunityPoolReward(
      authority,
      amount ? Coins.fromAmino(amount) : new Coins()
    )
  }

  public toAmino(): MsgFundCommunityPoolReward.Amino {
    const { authority, amount } = this
    return {
      type: 'reward/MsgFundCommunityPool',
      value: {
        authority,
        amount: amount.toArray().length > 0 ? amount.toAmino() : null,
      },
    }
  }

  public static fromData(
    data: MsgFundCommunityPoolReward.Data
  ): MsgFundCommunityPoolReward {
    const { authority, amount } = data
    return new MsgFundCommunityPoolReward(authority, Coins.fromData(amount))
  }

  public toData(): MsgFundCommunityPoolReward.Data {
    const { authority, amount } = this
    return {
      '@type': '/initia.reward.v1.MsgFundCommunityPool',
      authority,
      amount: amount.toData(),
    }
  }

  public static fromProto(
    data: MsgFundCommunityPoolReward.Proto
  ): MsgFundCommunityPoolReward {
    return new MsgFundCommunityPoolReward(
      data.authority,
      Coins.fromProto(data.amount)
    )
  }

  public toProto(): MsgFundCommunityPoolReward.Proto {
    const { authority, amount } = this
    return MsgFundCommunityPool_pb.fromPartial({
      authority,
      amount: amount.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.reward.v1.MsgFundCommunityPool',
      value: MsgFundCommunityPool_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgFundCommunityPoolReward {
    return MsgFundCommunityPoolReward.fromProto(
      MsgFundCommunityPool_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgFundCommunityPoolReward {
  export interface Amino {
    type: 'reward/MsgFundCommunityPool'
    value: {
      authority: AccAddress
      amount: Coins.Amino | null
    }
  }

  export interface Data {
    '@type': '/initia.reward.v1.MsgFundCommunityPool'
    authority: AccAddress
    amount: Coins.Data
  }

  export type Proto = MsgFundCommunityPool_pb
}
