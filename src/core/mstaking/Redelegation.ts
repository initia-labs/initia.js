import { JSONSerializable } from '../../util/json'
import { Coins } from '../Coins'
import { AccAddress, ValAddress } from '../bech32'
import {
  RedelegationResponse as RedelegationResponse_pb,
  Redelegation as Redelegation_pb,
  RedelegationEntry as RedelegationEntry_pb,
  RedelegationEntryResponse as RedelegationEntryResponse_pb,
} from '@initia/initia.proto/initia/mstaking/v1/staking'

/**
 * A redelegation is when a delegator decides to stop mstaking with one validator and
 * transfer their delegation to another validator. Rather than unbonding (which takes
 * some time) and re-staking, the funds can be redelegated immediately if a
 * [[Redelegation.Entry]] can be created.
 *
 * A redelegation, like an unbonding delegation, is implemented through
 * [[Redelegation.Entry]] objects, limited by the `max_entry` parameter in the mstaking
 * module params. For each pair of source and target validators, you cannot redelegate
 * more times than the amount of entries. Entries are cleared when the redelegation is
 * completed, the same amount of time as unbonding.
 */
export class Redelegation extends JSONSerializable<
  Redelegation.Amino,
  Redelegation.Data,
  Redelegation.Proto
> {
  /**
   *
   * @param delegator_address delegator's account address
   * @param validator_src_address source validator's operator address (from)
   * @param validator_dst_address target validator's operator address (to)
   * @param entries entries
   */
  constructor(
    public delegator_address: AccAddress,
    public validator_src_address: ValAddress,
    public validator_dst_address: ValAddress,
    public entries: Redelegation.Entry[]
  ) {
    super()
  }

  public static fromAmino(data: Redelegation.Amino): Redelegation {
    const {
      redelegation: {
        delegator_address,
        validator_src_address,
        validator_dst_address,
      },
      entries,
    } = data
    return new Redelegation(
      delegator_address,
      validator_src_address,
      validator_dst_address,
      entries.map((e) => Redelegation.Entry.fromAmino(e))
    )
  }

  public toAmino(): Redelegation.Amino {
    const {
      delegator_address,
      validator_src_address,
      validator_dst_address,
      entries,
    } = this
    return {
      redelegation: {
        delegator_address,
        validator_src_address,
        validator_dst_address,
      },
      entries: entries.map((e) => e.toAmino()),
    }
  }

  public static fromData(data: Redelegation.Data): Redelegation {
    const {
      redelegation: {
        delegator_address,
        validator_src_address,
        validator_dst_address,
      },
      entries,
    } = data
    return new Redelegation(
      delegator_address,
      validator_src_address,
      validator_dst_address,
      entries.map((e) => Redelegation.Entry.fromData(e))
    )
  }

  public toData(): Redelegation.Data {
    const {
      delegator_address,
      validator_src_address,
      validator_dst_address,
      entries,
    } = this
    return {
      redelegation: {
        delegator_address,
        validator_src_address,
        validator_dst_address,
      },
      entries: entries.map((e) => e.toData()),
    }
  }

  public static fromProto(data: Redelegation.Proto): Redelegation {
    const redelegationProto = data.redelegation as Redelegation_pb
    return new Redelegation(
      redelegationProto.delegatorAddress,
      redelegationProto.validatorDstAddress,
      redelegationProto.validatorDstAddress,
      data.entries.map((e) => Redelegation.Entry.fromProto(e))
    )
  }

  public toProto(): Redelegation.Proto {
    const {
      delegator_address,
      validator_src_address,
      validator_dst_address,
      entries,
    } = this

    return RedelegationResponse_pb.fromPartial({
      entries: entries.map((e) => e.toProto()),
      redelegation: Redelegation_pb.fromPartial({
        delegatorAddress: delegator_address,
        entries: entries.map(
          (e) => e.toProto().redelegationEntry as RedelegationEntry_pb
        ),
        validatorDstAddress: validator_dst_address,
        validatorSrcAddress: validator_src_address,
      }),
    })
  }
}

export namespace Redelegation {
  export interface Amino {
    redelegation: {
      delegator_address: AccAddress
      validator_src_address: ValAddress
      validator_dst_address: ValAddress
    }
    entries: Redelegation.Entry.Amino[]
  }

  export interface Data {
    redelegation: {
      delegator_address: AccAddress
      validator_src_address: ValAddress
      validator_dst_address: ValAddress
    }
    entries: Redelegation.Entry.Data[]
  }

  export type Proto = RedelegationResponse_pb

  export class Entry extends JSONSerializable<
    Entry.Amino,
    Entry.Data,
    Entry.Proto
  > {
    public initial_balance: Coins
    public shares_dst: Coins
    public balance: Coins

    /**
     *
     * @param initial_balance balance of delegation prior to initiating redelegation
     * @param shares_dst
     * @param creation_height 	height of blockchain when entry was created
     * @param completion_time time when redelegation entry will be removed
     */
    constructor(
      initial_balance: Coins.Input,
      balance: Coins.Input,
      shares_dst: Coins.Input,
      public creation_height: number,
      public completion_time: Date
    ) {
      super()
      this.initial_balance = new Coins(initial_balance)
      this.balance = new Coins(balance)
      this.shares_dst = new Coins(shares_dst)
    }

    public toAmino(): Entry.Amino {
      return {
        redelegation_entry: {
          initial_balance: this.initial_balance.toAmino(),
          shares_dst: this.shares_dst.toAmino(),
          creation_height: this.creation_height,
          completion_time: this.completion_time.toISOString(),
        },
        balance: this.balance.toAmino(),
      }
    }

    public static fromAmino(data: Entry.Amino): Entry {
      const {
        redelegation_entry: {
          initial_balance,
          shares_dst,
          creation_height,
          completion_time,
        },
        balance,
      } = data
      return new Entry(
        Coins.fromAmino(initial_balance),
        Coins.fromAmino(balance),
        Coins.fromAmino(shares_dst),
        creation_height,
        new Date(completion_time)
      )
    }

    public toData(): Entry.Data {
      return {
        redelegation_entry: {
          initial_balance: this.initial_balance.toData(),
          shares_dst: this.shares_dst.toData(),
          creation_height: this.creation_height,
          completion_time: this.completion_time.toISOString(),
        },
        balance: this.balance.toData(),
      }
    }

    public static fromData(data: Entry.Data): Entry {
      const {
        redelegation_entry: {
          initial_balance,
          shares_dst,
          creation_height,
          completion_time,
        },
        balance,
      } = data
      return new Entry(
        Coins.fromData(initial_balance),
        Coins.fromData(balance),
        Coins.fromData(shares_dst),
        creation_height,
        new Date(completion_time)
      )
    }

    public toProto(): Entry.Proto {
      const {
        initial_balance,
        balance,
        shares_dst,
        creation_height,
        completion_time,
      } = this

      return RedelegationEntryResponse_pb.fromPartial({
        balance: balance.toProto(),
        redelegationEntry: RedelegationEntry_pb.fromPartial({
          completionTime: completion_time,
          creationHeight: creation_height,
          initialBalance: initial_balance.toProto(),
          sharesDst: shares_dst.toProto(),
        }),
      })
    }

    public static fromProto(proto: Entry.Proto): Entry {
      const redelegationEntryProto =
        proto.redelegationEntry as RedelegationEntry_pb

      return new Entry(
        Coins.fromProto(redelegationEntryProto.initialBalance),
        Coins.fromProto(proto.balance),
        Coins.fromProto(redelegationEntryProto.sharesDst),
        redelegationEntryProto.creationHeight.toNumber(),
        redelegationEntryProto.completionTime as Date
      )
    }
  }

  export namespace Entry {
    export interface Amino {
      redelegation_entry: {
        creation_height: number
        completion_time: string
        initial_balance: Coins.Amino
        shares_dst: Coins.Amino
      }
      balance: Coins.Amino
    }

    export interface Data {
      redelegation_entry: {
        creation_height: number
        completion_time: string
        initial_balance: Coins.Data
        shares_dst: Coins.Data
      }
      balance: Coins.Data
    }

    export type Proto = RedelegationEntryResponse_pb
  }
}
