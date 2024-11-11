import { FungibleTokenPacketData as FungibleTokenPacketData_pb } from '@initia/initia.proto/ibc/applications/transfer/v2/packet'
import { JSONSerializable } from '../../../../util/json'

/**
 * FungibleTokenPacketData defines a struct for the packet payload.
 * See FungibleTokenPacketData spec:
 * https://github.com/cosmos/ibc/tree/master/spec/app/ics-020-fungible-token-transfer#data-structures
 */
export class FungibleTokenPacketData extends JSONSerializable<
  FungibleTokenPacketData.Amino,
  FungibleTokenPacketData.Data,
  FungibleTokenPacketData.Proto
> {
  /**
   * @param denom the token denomination to be transferred
   * @param amount the token amount to be transferred
   * @param sender the sender address
   * @param receiver the recipient address on the destination chain
   * @param memo optional memo
   */
  constructor(
    public denom: string,
    public amount: string,
    public sender: string,
    public receiver: string,
    public memo?: string
  ) {
    super()
  }

  public static fromAmino(
    data: FungibleTokenPacketData.Amino
  ): FungibleTokenPacketData {
    const { denom, amount, sender, receiver, memo } = data
    return new FungibleTokenPacketData(denom, amount, sender, receiver, memo)
  }

  public toAmino(): FungibleTokenPacketData.Amino {
    const { denom, amount, sender, receiver, memo } = this
    return {
      denom,
      amount,
      sender,
      receiver,
      memo,
    }
  }

  public static fromData(
    data: FungibleTokenPacketData.Data
  ): FungibleTokenPacketData {
    const { denom, amount, sender, receiver, memo } = data
    return new FungibleTokenPacketData(denom, amount, sender, receiver, memo)
  }

  public toData(): FungibleTokenPacketData.Data {
    const { denom, amount, sender, receiver, memo } = this
    return {
      denom,
      amount,
      sender,
      receiver,
      memo,
    }
  }

  public static fromProto(
    proto: FungibleTokenPacketData.Proto
  ): FungibleTokenPacketData {
    return new FungibleTokenPacketData(
      proto.denom,
      proto.amount,
      proto.sender,
      proto.receiver,
      proto.memo
    )
  }

  public toProto(): FungibleTokenPacketData.Proto {
    const { denom, amount, sender, receiver, memo } = this
    return FungibleTokenPacketData_pb.fromPartial({
      denom,
      amount,
      sender,
      receiver,
      memo,
    })
  }
}

export namespace FungibleTokenPacketData {
  export interface Amino {
    denom: string
    amount: string
    sender: string
    receiver: string
    memo?: string
  }

  export interface Data {
    denom: string
    amount: string
    sender: string
    receiver: string
    memo?: string
  }

  export type Proto = FungibleTokenPacketData_pb
}
