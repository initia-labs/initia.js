import { JSONSerializable } from '../../../util/json'
import { Coins } from '../../Coins'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgCommunityPoolSpend as MsgCommunityPoolSpend_pb } from '@initia/initia.proto/cosmos/distribution/v1beta1/tx'

/**
 * defines a message for sending tokens from the community pool to another account
 */
export class MsgCommunityPoolSpend extends JSONSerializable<
  MsgCommunityPoolSpend.Amino,
  MsgCommunityPoolSpend.Data,
  MsgCommunityPoolSpend.Proto
> {
  public amount: Coins
  /**
   * @param authority the address that controls the module
   * @param recipient recipient address
   * @param amount amount to give recipient
   */
  constructor(
    public authority: AccAddress,
    public recipient: AccAddress,
    amount: Coins.Input
  ) {
    super()
    this.amount = new Coins(amount)
  }

  public static fromAmino(
    data: MsgCommunityPoolSpend.Amino
  ): MsgCommunityPoolSpend {
    const {
      value: { authority, recipient, amount },
    } = data
    return new MsgCommunityPoolSpend(
      authority,
      recipient,
      Coins.fromAmino(amount)
    )
  }

  public toAmino(): MsgCommunityPoolSpend.Amino {
    const { authority, recipient, amount } = this
    return {
      type: 'cosmos-sdk/distr/MsgCommunityPoolSpend',
      value: {
        authority,
        recipient,
        amount: amount.toAmino(),
      },
    }
  }

  public static fromData(
    data: MsgCommunityPoolSpend.Data
  ): MsgCommunityPoolSpend {
    const { authority, recipient, amount } = data
    return new MsgCommunityPoolSpend(
      authority,
      recipient,
      Coins.fromData(amount)
    )
  }

  public toData(): MsgCommunityPoolSpend.Data {
    const { authority, recipient, amount } = this
    return {
      '@type': '/cosmos.distribution.v1beta1.MsgCommunityPoolSpend',
      authority,
      recipient,
      amount: amount.toData(),
    }
  }

  public static fromProto(
    proto: MsgCommunityPoolSpend.Proto
  ): MsgCommunityPoolSpend {
    return new MsgCommunityPoolSpend(
      proto.authority,
      proto.recipient,
      Coins.fromProto(proto.amount)
    )
  }

  public toProto(): MsgCommunityPoolSpend.Proto {
    const { authority, recipient, amount } = this
    return MsgCommunityPoolSpend_pb.fromPartial({
      authority,
      recipient,
      amount: amount.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.distribution.v1beta1.MsgCommunityPoolSpend',
      value: MsgCommunityPoolSpend_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgCommunityPoolSpend {
    return MsgCommunityPoolSpend.fromProto(
      MsgCommunityPoolSpend_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgCommunityPoolSpend {
  export interface Amino {
    type: 'cosmos-sdk/distr/MsgCommunityPoolSpend'
    value: {
      authority: AccAddress
      recipient: AccAddress
      amount: Coins.Amino
    }
  }

  export interface Data {
    '@type': '/cosmos.distribution.v1beta1.MsgCommunityPoolSpend'
    authority: AccAddress
    recipient: AccAddress
    amount: Coins.Data
  }

  export type Proto = MsgCommunityPoolSpend_pb
}
