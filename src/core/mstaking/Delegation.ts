import { JSONSerializable } from '../../util/json'
import { AccAddress, ValAddress } from '../bech32'
import { Coins } from '../Coins'
import {
  DelegationResponse as DelegationResponse_pb,
  Delegation as Delegation_pb,
} from '@initia/initia.proto/initia/mstaking/v1/staking'

/**
 * Delegation stores information about the status of a delegation between a delegator and validator, fetched from the blockchain.
 */
export class Delegation extends JSONSerializable<
  Delegation.Amino,
  Delegation.Data,
  Delegation.Proto
> {
  public shares: Coins
  public balance: Coins

  /**
   * @param delegator_address delegator's account address
   * @param validator_address validator's operator address
   * @param shares delegator's shares
   * @param balance balance of the delegation
   */
  constructor(
    public delegator_address: AccAddress,
    public validator_address: ValAddress,
    shares: Coins.Input,
    balance: Coins.Input
  ) {
    super()
    this.shares = new Coins(shares)
    this.balance = new Coins(balance)
  }

  public static fromAmino(data: Delegation.Amino): Delegation {
    const {
      delegation: { delegator_address, validator_address, shares },
      balance,
    } = data
    return new Delegation(
      delegator_address,
      validator_address,
      Coins.fromAmino(shares),
      Coins.fromAmino(balance)
    )
  }

  public toAmino(): Delegation.Amino {
    const { delegator_address, validator_address, shares, balance } = this

    return {
      delegation: {
        delegator_address,
        validator_address,
        shares: shares.toAmino(),
      },
      balance: balance.toAmino(),
    }
  }

  public static fromData(data: Delegation.Data): Delegation {
    const {
      delegation: { delegator_address, validator_address, shares },
      balance,
    } = data
    return new Delegation(
      delegator_address,
      validator_address,
      Coins.fromData(shares),
      Coins.fromData(balance)
    )
  }

  public toData(): Delegation.Data {
    const { delegator_address, validator_address, shares, balance } = this

    return {
      delegation: {
        delegator_address,
        validator_address,
        shares: shares.toData(),
      },
      balance: balance.toData(),
    }
  }

  public static fromProto(proto: Delegation.Proto): Delegation {
    const delegationProto = proto.delegation as Delegation_pb
    return new Delegation(
      delegationProto.delegatorAddress,
      delegationProto.validatorAddress,
      Coins.fromProto(delegationProto.shares),
      Coins.fromProto(proto.balance as Coins.Proto)
    )
  }

  public toProto(): Delegation.Proto {
    const { delegator_address, validator_address, shares, balance } = this
    return DelegationResponse_pb.fromPartial({
      delegation: Delegation_pb.fromPartial({
        delegatorAddress: delegator_address,
        validatorAddress: validator_address,
        shares: shares.toProto(),
      }),
      balance: balance.toProto(),
    })
  }
}

export namespace Delegation {
  export interface Amino {
    delegation: {
      delegator_address: AccAddress
      validator_address: ValAddress
      shares: Coins.Amino
    }
    balance: Coins.Amino
  }

  export interface Data {
    delegation: {
      delegator_address: AccAddress
      validator_address: ValAddress
      shares: Coins.Data
    }
    balance: Coins.Data
  }

  export type Proto = DelegationResponse_pb
}
