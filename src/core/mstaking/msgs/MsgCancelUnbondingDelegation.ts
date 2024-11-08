import { Coins } from '../../Coins'
import { JSONSerializable } from '../../../util/json'
import { AccAddress, ValAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgCancelUnbondingDelegation as MsgCancelUnbondingDelegation_pb } from '@initia/initia.proto/initia/mstaking/v1/tx'

/**
 * MsgCancelUnbondingDelegation defines a method for performing canceling the unbonding delegation
 * and delegate back to previous validator.
 */
export class MsgCancelUnbondingDelegation extends JSONSerializable<
  MsgCancelUnbondingDelegation.Amino,
  MsgCancelUnbondingDelegation.Data,
  MsgCancelUnbondingDelegation.Proto
> {
  public amount: Coins

  /**
   * @param delegator_address delegator's account address
   * @param validator_address validator's operator address
   * @param amount INIT to be undelegated
   */
  constructor(
    public delegator_address: AccAddress,
    public validator_address: ValAddress,
    amount: Coins.Input,
    public creation_height: number
  ) {
    super()
    this.amount = new Coins(amount)
  }

  public static fromAmino(
    data: MsgCancelUnbondingDelegation.Amino
  ): MsgCancelUnbondingDelegation {
    const {
      value: { delegator_address, validator_address, amount, creation_height },
    } = data
    return new MsgCancelUnbondingDelegation(
      delegator_address,
      validator_address,
      Coins.fromAmino(amount),
      parseInt(creation_height)
    )
  }

  public toAmino(): MsgCancelUnbondingDelegation.Amino {
    const { delegator_address, validator_address, amount, creation_height } =
      this
    return {
      type: 'mstaking/MsgCancelUnbondingDelegation',
      value: {
        delegator_address,
        validator_address,
        amount: amount.toAmino(),
        creation_height: creation_height.toFixed(),
      },
    }
  }

  public static fromData(
    data: MsgCancelUnbondingDelegation.Data
  ): MsgCancelUnbondingDelegation {
    const { delegator_address, validator_address, amount, creation_height } =
      data
    return new MsgCancelUnbondingDelegation(
      delegator_address,
      validator_address,
      Coins.fromData(amount),
      parseInt(creation_height)
    )
  }

  public toData(): MsgCancelUnbondingDelegation.Data {
    const { delegator_address, validator_address, amount, creation_height } =
      this
    return {
      '@type': '/initia.mstaking.v1.MsgCancelUnbondingDelegation',
      delegator_address,
      validator_address,
      amount: amount.toData(),
      creation_height: creation_height.toFixed(),
    }
  }

  public static fromProto(
    proto: MsgCancelUnbondingDelegation.Proto
  ): MsgCancelUnbondingDelegation {
    return new MsgCancelUnbondingDelegation(
      proto.delegatorAddress,
      proto.validatorAddress,
      Coins.fromProto(proto.amount as Coins.Proto),
      proto.creationHeight.toNumber()
    )
  }

  public toProto(): MsgCancelUnbondingDelegation.Proto {
    const { delegator_address, validator_address, amount, creation_height } =
      this
    return MsgCancelUnbondingDelegation_pb.fromPartial({
      amount: amount.toProto(),
      delegatorAddress: delegator_address,
      validatorAddress: validator_address,
      creationHeight: creation_height,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.mstaking.v1.MsgCancelUnbondingDelegation',
      value: MsgCancelUnbondingDelegation_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgCancelUnbondingDelegation {
    return MsgCancelUnbondingDelegation.fromProto(
      MsgCancelUnbondingDelegation_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgCancelUnbondingDelegation {
  export interface Amino {
    type: 'mstaking/MsgCancelUnbondingDelegation'
    value: {
      delegator_address: AccAddress
      validator_address: ValAddress
      amount: Coins.Amino
      creation_height: string
    }
  }

  export interface Data {
    '@type': '/initia.mstaking.v1.MsgCancelUnbondingDelegation'
    delegator_address: AccAddress
    validator_address: ValAddress
    amount: Coins.Data
    creation_height: string
  }

  export type Proto = MsgCancelUnbondingDelegation_pb
}
