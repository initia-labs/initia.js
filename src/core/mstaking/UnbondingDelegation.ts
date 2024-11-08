import { JSONSerializable } from '../../util/json'
import { Coins } from '../Coins'
import { AccAddress, ValAddress } from '../bech32'
import {
  UnbondingDelegation as UnbondingDelegation_pb,
  UnbondingDelegationEntry as UnbondingDelegationEntry_pb,
} from '@initia/initia.proto/initia/mstaking/v1/staking'

/**
 * UnbondingDelegation stores all of a single delegator's unbonding bonds
 * for a single validator in an time-ordered list.
 */
export class UnbondingDelegation extends JSONSerializable<
  UnbondingDelegation.Amino,
  UnbondingDelegation.Data,
  UnbondingDelegation.Proto
> {
  constructor(
    public delegator_address: AccAddress,
    public validator_address: ValAddress,
    public entries: UnbondingDelegation.Entry[]
  ) {
    super()
  }

  public static fromAmino(
    data: UnbondingDelegation.Amino
  ): UnbondingDelegation {
    const { delegator_address, validator_address, entries } = data
    return new UnbondingDelegation(
      delegator_address,
      validator_address,
      entries.map((e) => UnbondingDelegation.Entry.fromAmino(e))
    )
  }

  public toAmino(): UnbondingDelegation.Amino {
    const { delegator_address, validator_address, entries } = this
    return {
      delegator_address,
      validator_address,
      entries: entries.map((e) => e.toAmino()),
    }
  }

  public static fromData(data: UnbondingDelegation.Data): UnbondingDelegation {
    const { delegator_address, validator_address, entries } = data
    return new UnbondingDelegation(
      delegator_address,
      validator_address,
      entries.map((e) => UnbondingDelegation.Entry.fromData(e))
    )
  }

  public toData(): UnbondingDelegation.Data {
    const { delegator_address, validator_address, entries } = this
    return {
      delegator_address,
      validator_address,
      entries: entries.map((e) => e.toData()),
    }
  }

  public toProto(): UnbondingDelegation.Proto {
    const { delegator_address, validator_address, entries } = this
    return UnbondingDelegation_pb.fromPartial({
      delegatorAddress: delegator_address,
      entries: entries.map((e) => e.toProto()),
      validatorAddress: validator_address,
    })
  }

  public static fromProto(
    proto: UnbondingDelegation.Proto
  ): UnbondingDelegation {
    return new UnbondingDelegation(
      proto.delegatorAddress,
      proto.validatorAddress,
      proto.entries.map((e) => UnbondingDelegation.Entry.fromProto(e))
    )
  }
}

export namespace UnbondingDelegation {
  export interface Amino {
    delegator_address: AccAddress
    validator_address: ValAddress
    entries: UnbondingDelegation.Entry.Amino[]
  }

  export interface Data {
    delegator_address: AccAddress
    validator_address: ValAddress
    entries: UnbondingDelegation.Entry.Data[]
  }

  export type Proto = UnbondingDelegation_pb

  export class Entry extends JSONSerializable<
    Entry.Amino,
    Entry.Data,
    Entry.Proto
  > {
    public initial_balance: Coins
    public balance: Coins

    /**
     * Note that the size of the undelegation is `initial_balance - balance`
     * @param initial_balance balance of delegation prior to initiating unbond
     * @param balance balance of delegation after initiating unbond
     * @param creation_height height of blockchain when entry was created
     * @param completion_time time when unbonding will be completed
     */
    constructor(
      initial_balance: Coins.Input,
      balance: Coins.Input,
      public creation_height: number,
      public completion_time: Date
    ) {
      super()
      this.initial_balance = new Coins(initial_balance)
      this.balance = new Coins(balance)
    }

    public static fromAmino(data: Entry.Amino): Entry {
      const { initial_balance, balance, creation_height, completion_time } =
        data
      return new Entry(
        Coins.fromAmino(initial_balance),
        Coins.fromAmino(balance),
        parseInt(creation_height),
        new Date(completion_time)
      )
    }

    public toAmino(): Entry.Amino {
      return {
        initial_balance: this.initial_balance.toAmino(),
        balance: this.balance.toAmino(),
        creation_height: this.creation_height.toFixed(),
        completion_time: this.completion_time.toISOString(),
      }
    }

    public static fromData(data: Entry.Data): Entry {
      const { initial_balance, balance, creation_height, completion_time } =
        data
      return new Entry(
        Coins.fromData(initial_balance),
        Coins.fromData(balance),
        parseInt(creation_height),
        new Date(completion_time)
      )
    }

    public toData(): Entry.Data {
      return {
        initial_balance: this.initial_balance.toData(),
        balance: this.balance.toData(),
        creation_height: this.creation_height.toFixed(),
        completion_time: this.completion_time.toISOString(),
      }
    }

    public static fromProto(proto: Entry.Proto): Entry {
      return new Entry(
        Coins.fromProto(proto.initialBalance),
        Coins.fromProto(proto.balance),
        proto.creationHeight.toNumber(),
        proto.completionTime as Date
      )
    }

    public toProto(): Entry.Proto {
      const { initial_balance, balance, creation_height, completion_time } =
        this
      return UnbondingDelegationEntry_pb.fromPartial({
        balance: balance.toProto(),
        completionTime: completion_time,
        creationHeight: creation_height,
        initialBalance: initial_balance.toProto(),
      })
    }
  }

  export namespace Entry {
    export interface Amino {
      initial_balance: Coins.Amino
      balance: Coins.Amino
      creation_height: string
      completion_time: string
    }

    export interface Data {
      initial_balance: Coins.Data
      balance: Coins.Data
      creation_height: string
      completion_time: string
    }

    export type Proto = UnbondingDelegationEntry_pb
  }
}
