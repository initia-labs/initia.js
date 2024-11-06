import { Coins } from '../../Coins'
import { JSONSerializable } from '../../../util/json'
import { AccAddress, ValAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgDelegate as MsgDelegate_pb } from '@initia/initia.proto/initia/mstaking/v1/tx'

/**
 * A delegator can submit this message to send more Initia to be staked through a
 * validator delegate.
 */
export class MsgDelegate extends JSONSerializable<
  MsgDelegate.Amino,
  MsgDelegate.Data,
  MsgDelegate.Proto
> {
  public amount: Coins

  /**
   *
   * @param delegator_address delegator's account address
   * @param validator_address validator's operator address
   * @param amount amount of INIT to be sent for delegation
   */
  constructor(
    public delegator_address: AccAddress,
    public validator_address: ValAddress,
    amount: Coins.Input
  ) {
    super()
    this.amount = new Coins(amount)
  }

  public static fromAmino(data: MsgDelegate.Amino): MsgDelegate {
    const {
      value: { delegator_address, validator_address, amount },
    } = data
    return new MsgDelegate(
      delegator_address,
      validator_address,
      Coins.fromAmino(amount)
    )
  }

  public toAmino(): MsgDelegate.Amino {
    const { delegator_address, validator_address, amount } = this
    return {
      type: 'mstaking/MsgDelegate',
      value: {
        delegator_address,
        validator_address,
        amount: amount.toAmino(),
      },
    }
  }

  public static fromData(data: MsgDelegate.Data): MsgDelegate {
    const { delegator_address, validator_address, amount } = data
    return new MsgDelegate(
      delegator_address,
      validator_address,
      Coins.fromData(amount)
    )
  }

  public toData(): MsgDelegate.Data {
    const { delegator_address, validator_address, amount } = this
    return {
      '@type': '/initia.mstaking.v1.MsgDelegate',
      delegator_address,
      validator_address,
      amount: amount.toData(),
    }
  }

  public static fromProto(proto: MsgDelegate.Proto): MsgDelegate {
    return new MsgDelegate(
      proto.delegatorAddress,
      proto.validatorAddress,
      Coins.fromProto(proto.amount as Coins.Proto)
    )
  }

  public toProto(): MsgDelegate.Proto {
    const { delegator_address, validator_address, amount } = this
    return MsgDelegate_pb.fromPartial({
      amount: amount.toProto(),
      delegatorAddress: delegator_address,
      validatorAddress: validator_address,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.mstaking.v1.MsgDelegate',
      value: MsgDelegate_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgDelegate {
    return MsgDelegate.fromProto(MsgDelegate_pb.decode(msgAny.value))
  }
}

export namespace MsgDelegate {
  export interface Amino {
    type: 'mstaking/MsgDelegate'
    value: {
      delegator_address: AccAddress
      validator_address: ValAddress
      amount: Coins.Amino
    }
  }

  export interface Data {
    '@type': '/initia.mstaking.v1.MsgDelegate'
    delegator_address: AccAddress
    validator_address: ValAddress
    amount: Coins.Data
  }

  export type Proto = MsgDelegate_pb
}
