import { JSONSerializable } from '../../../util/json'
import { Coins } from '../../Coins'
import { AccAddress, ValAddress } from '../../bech32'
import { Denom } from '../../Denom'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgDepositValidatorRewardsPool as MsgDepositValidatorRewardsPool_pb } from '@initia/initia.proto/initia/distribution/v1/tx'

export class MsgDepositValidatorRewardsPool extends JSONSerializable<
  MsgDepositValidatorRewardsPool.Amino,
  MsgDepositValidatorRewardsPool.Data,
  MsgDepositValidatorRewardsPool.Proto
> {
  public amount: Coins
  /**
   * @param depositor
   * @param validator_address
   * @param denom
   * @param amount
   */
  constructor(
    public depositor: AccAddress,
    public validator_address: ValAddress,
    public denom: Denom,
    amount: Coins.Input
  ) {
    super()
    this.amount = new Coins(amount)
  }

  public static fromAmino(
    data: MsgDepositValidatorRewardsPool.Amino
  ): MsgDepositValidatorRewardsPool {
    const {
      value: { depositor, validator_address, denom, amount },
    } = data
    return new MsgDepositValidatorRewardsPool(
      depositor,
      validator_address,
      denom,
      Coins.fromAmino(amount)
    )
  }

  public toAmino(): MsgDepositValidatorRewardsPool.Amino {
    const { depositor, validator_address, denom, amount } = this
    return {
      type: 'distr/MsgDepositValidatorRewardsPool',
      value: {
        depositor,
        validator_address,
        denom,
        amount: amount.toAmino(),
      },
    }
  }

  public static fromData(
    data: MsgDepositValidatorRewardsPool.Data
  ): MsgDepositValidatorRewardsPool {
    const { depositor, validator_address, denom, amount } = data
    return new MsgDepositValidatorRewardsPool(
      depositor,
      validator_address,
      denom,
      Coins.fromData(amount)
    )
  }

  public toData(): MsgDepositValidatorRewardsPool.Data {
    const { depositor, validator_address, denom, amount } = this
    return {
      '@type': '/initia.distribution.v1.MsgDepositValidatorRewardsPool',
      depositor,
      validator_address,
      denom,
      amount: amount.toData(),
    }
  }

  public static fromProto(
    proto: MsgDepositValidatorRewardsPool.Proto
  ): MsgDepositValidatorRewardsPool {
    return new MsgDepositValidatorRewardsPool(
      proto.depositor,
      proto.validatorAddress,
      proto.denom,
      Coins.fromProto(proto.amount)
    )
  }

  public toProto(): MsgDepositValidatorRewardsPool.Proto {
    const { depositor, validator_address, denom, amount } = this
    return MsgDepositValidatorRewardsPool_pb.fromPartial({
      depositor,
      validatorAddress: validator_address,
      denom,
      amount: amount.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.distribution.v1.MsgDepositValidatorRewardsPool',
      value: MsgDepositValidatorRewardsPool_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgDepositValidatorRewardsPool {
    return MsgDepositValidatorRewardsPool.fromProto(
      MsgDepositValidatorRewardsPool_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgDepositValidatorRewardsPool {
  export interface Amino {
    type: 'distr/MsgDepositValidatorRewardsPool'
    value: {
      depositor: AccAddress
      validator_address: ValAddress
      denom: Denom
      amount: Coins.Amino
    }
  }

  export interface Data {
    '@type': '/initia.distribution.v1.MsgDepositValidatorRewardsPool'
    depositor: AccAddress
    validator_address: ValAddress
    denom: Denom
    amount: Coins.Data
  }

  export type Proto = MsgDepositValidatorRewardsPool_pb
}
