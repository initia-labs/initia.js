import { JSONSerializable } from '../../../util/json'
import { Coins } from '../../Coins'
import { AccAddress, ValAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgBeginRedelegate as MsgBeginRedelegate_pb } from '@initia/initia.proto/initia/mstaking/v1/tx'

/**
 * MsgBeginRedelegate defines a method for performing a redelegation
 * of coins from a delegator and source validator to a destination validator.
 */
export class MsgBeginRedelegate extends JSONSerializable<
  MsgBeginRedelegate.Amino,
  MsgBeginRedelegate.Data,
  MsgBeginRedelegate.Proto
> {
  public amount: Coins

  /**
   * @param delegator_address delegator's account address
   * @param validator_src_address validator to undelegate from
   * @param validator_dst_address validator to delegate to
   * @param amount INIT to be redelegated
   */
  constructor(
    public delegator_address: AccAddress,
    public validator_src_address: ValAddress,
    public validator_dst_address: ValAddress,
    amount: Coins.Input
  ) {
    super()
    this.amount = new Coins(amount)
  }

  public static fromAmino(data: MsgBeginRedelegate.Amino): MsgBeginRedelegate {
    const {
      value: {
        delegator_address,
        validator_src_address,
        validator_dst_address,
        amount,
      },
    } = data
    return new MsgBeginRedelegate(
      delegator_address,
      validator_src_address,
      validator_dst_address,
      amount ? Coins.fromAmino(amount) : new Coins()
    )
  }

  public toAmino(): MsgBeginRedelegate.Amino {
    const {
      delegator_address,
      validator_src_address,
      validator_dst_address,
      amount,
    } = this
    return {
      type: 'mstaking/MsgBeginRedelegate',
      value: {
        delegator_address,
        validator_src_address,
        validator_dst_address,
        amount: amount.toArray().length > 0 ? amount.toAmino() : null,
      },
    }
  }

  public static fromData(data: MsgBeginRedelegate.Data): MsgBeginRedelegate {
    const {
      delegator_address,
      validator_src_address,
      validator_dst_address,
      amount,
    } = data
    return new MsgBeginRedelegate(
      delegator_address,
      validator_src_address,
      validator_dst_address,
      Coins.fromData(amount)
    )
  }

  public toData(): MsgBeginRedelegate.Data {
    const {
      delegator_address,
      validator_src_address,
      validator_dst_address,
      amount,
    } = this
    return {
      '@type': '/initia.mstaking.v1.MsgBeginRedelegate',
      delegator_address,
      validator_src_address,
      validator_dst_address,
      amount: amount.toData(),
    }
  }

  public static fromProto(proto: MsgBeginRedelegate.Proto): MsgBeginRedelegate {
    return new MsgBeginRedelegate(
      proto.delegatorAddress,
      proto.validatorSrcAddress,
      proto.validatorDstAddress,
      Coins.fromProto(proto.amount as Coins.Proto)
    )
  }

  public toProto(): MsgBeginRedelegate.Proto {
    const {
      delegator_address,
      validator_src_address,
      validator_dst_address,
      amount,
    } = this
    return MsgBeginRedelegate_pb.fromPartial({
      amount: amount.toProto(),
      delegatorAddress: delegator_address,
      validatorDstAddress: validator_dst_address,
      validatorSrcAddress: validator_src_address,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.mstaking.v1.MsgBeginRedelegate',
      value: MsgBeginRedelegate_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgBeginRedelegate {
    return MsgBeginRedelegate.fromProto(
      MsgBeginRedelegate_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgBeginRedelegate {
  export interface Amino {
    type: 'mstaking/MsgBeginRedelegate'
    value: {
      delegator_address: AccAddress
      validator_src_address: ValAddress
      validator_dst_address: ValAddress
      amount: Coins.Amino | null
    }
  }

  export interface Data {
    '@type': '/initia.mstaking.v1.MsgBeginRedelegate'
    delegator_address: AccAddress
    validator_src_address: ValAddress
    validator_dst_address: ValAddress
    amount: Coins.Data
  }

  export type Proto = MsgBeginRedelegate_pb
}
