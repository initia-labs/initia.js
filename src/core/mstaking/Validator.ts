import { JSONSerializable } from '../../util/json'
import { Coins } from '../Coins'
import { ValAddress } from '../bech32'
import { ValConsPublicKey } from '../PublicKey'
import {
  Validator as Validator_pb,
  Description as Description_pb,
  Commission as Commission_pb,
  CommissionRates as CommissionRates_pb,
  BondStatus,
} from '@initia/initia.proto/initia/mstaking/v1/staking'
import { Any } from '@initia/initia.proto/google/protobuf/any'

/**
 * Validator stores information fetched from the blockchain about the current status of a validator.
 * As an end user, you will not have to create an instance of this class, one will be
 * generated for you to store information about a validator polled from the API functions
 * in [[MstakingAPI]].
 */
export class Validator extends JSONSerializable<
  Validator.Amino,
  Validator.Data,
  Validator.Proto
> {
  public tokens: Coins
  public delegator_shares: Coins
  public voting_powers: Coins

  /**
   * @param operator_address validator's operator address
   * @param consensus_pubkey validator's consensus public key
   * @param jailed whether the current validator is jailed
   * @param status unbonded `0`, unbonding `1`, bonded `2`
   * @param tokens total INIT from all delegations (including self)
   * @param delegator_shares total shares of all delegators
   * @param description validator's delegate description
   * @param unbonding_height if unbonding, height at which this validator began unbonding
   * @param unbonding_time if unbonding, min time for the validator to complete unbonding
   * @param commission validator commission
   * @param min_self_delegation minimum self delegation
   */
  constructor(
    public operator_address: ValAddress,
    public consensus_pubkey: ValConsPublicKey,
    public jailed: boolean,
    public status: BondStatus,
    tokens: Coins.Input,
    delegator_shares: Coins.Input,
    public description: Validator.Description,
    public unbonding_height: number,
    public unbonding_time: Date,
    public commission: Validator.Commission,
    voting_powers: Coins.Input,
    public voting_power: string
  ) {
    super()
    this.tokens = new Coins(tokens)
    this.delegator_shares = new Coins(delegator_shares)
    this.voting_powers = new Coins(voting_powers)
  }

  public static fromAmino(data: Validator.Amino): Validator {
    return new Validator(
      data.operator_address,
      ValConsPublicKey.fromAmino(data.consensus_pubkey),
      data.jailed || false,
      data.status || 0,
      Coins.fromAmino(data.tokens),
      Coins.fromAmino(data.delegator_shares),
      Validator.Description.fromAmino(data.description),
      parseInt(data.unbonding_height),
      new Date(data.unbonding_time),
      Validator.Commission.fromAmino(data.commission),
      Coins.fromAmino(data.voting_powers),
      data.voting_power
    )
  }

  public toAmino(): Validator.Amino {
    return {
      operator_address: this.operator_address,
      consensus_pubkey: this.consensus_pubkey.toAmino(),
      jailed: this.jailed,
      status: this.status,
      tokens: this.tokens.toAmino(),
      delegator_shares: this.delegator_shares.toAmino(),
      description: this.description,
      unbonding_height: this.unbonding_height.toFixed(),
      unbonding_time: this.unbonding_time.toISOString(),
      commission: this.commission.toAmino(),
      voting_powers: this.voting_powers.toAmino(),
      voting_power: this.voting_power,
    }
  }

  public static fromData(data: Validator.Data): Validator {
    return new Validator(
      data.operator_address,
      ValConsPublicKey.fromData(data.consensus_pubkey),
      data.jailed || false,
      data.status || 0,
      Coins.fromData(data.tokens),
      Coins.fromData(data.delegator_shares),
      Validator.Description.fromData(data.description),
      parseInt(data.unbonding_height),
      new Date(data.unbonding_time),
      Validator.Commission.fromData(data.commission),
      Coins.fromData(data.voting_powers),
      data.voting_power
    )
  }

  public toData(): Validator.Data {
    return {
      operator_address: this.operator_address,
      consensus_pubkey: this.consensus_pubkey.toData(),
      jailed: this.jailed,
      status: this.status,
      tokens: this.tokens.toData(),
      delegator_shares: this.delegator_shares.toData(),
      description: this.description,
      unbonding_height: this.unbonding_height.toFixed(),
      unbonding_time: this.unbonding_time.toISOString(),
      commission: this.commission.toData(),
      voting_powers: this.voting_powers.toData(),
      voting_power: this.voting_power,
    }
  }

  public static fromProto(data: Validator.Proto): Validator {
    return new Validator(
      data.operatorAddress,
      ValConsPublicKey.unpackAny(data.consensusPubkey as Any),
      data.jailed,
      data.status,
      Coins.fromProto(data.tokens),
      Coins.fromProto(data.delegatorShares),
      Validator.Description.fromProto(
        data.description as Validator.Description.Proto
      ),
      Number(data.unbondingHeight),
      data.unbondingTime as Date,
      Validator.Commission.fromProto(
        data.commission as Validator.Commission.Proto
      ),
      Coins.fromProto(data.votingPowers),
      data.votingPower
    )
  }

  public toProto(): Validator.Proto {
    const {
      operator_address,
      consensus_pubkey,
      jailed,
      status,
      tokens,
      delegator_shares,
      description,
      unbonding_height,
      unbonding_time,
      commission,
      voting_powers,
      voting_power,
    } = this
    return Validator_pb.fromPartial({
      operatorAddress: operator_address,
      consensusPubkey: consensus_pubkey.packAny(),
      jailed,
      status,
      tokens: tokens.toProto(),
      delegatorShares: delegator_shares.toProto(),
      description: description.toProto(),
      unbondingHeight: BigInt(unbonding_height),
      unbondingTime: unbonding_time,
      commission: commission.toProto(),
      votingPowers: voting_powers.toProto(),
      votingPower: voting_power,
    })
  }
}

export namespace Validator {
  export const Status = BondStatus
  export type Status = BondStatus
  export interface Amino {
    operator_address: ValAddress
    consensus_pubkey: ValConsPublicKey.Amino
    jailed: boolean
    status: BondStatus
    tokens: Coins.Amino
    delegator_shares: Coins.Amino
    description: Description.Amino
    unbonding_height: string
    unbonding_time: string
    commission: Commission.Amino
    voting_powers: Coins.Amino
    voting_power: string
  }

  export interface Data {
    operator_address: ValAddress
    consensus_pubkey: ValConsPublicKey.Data
    jailed: boolean
    status: BondStatus
    tokens: Coins.Data
    delegator_shares: Coins.Data
    description: Description.Data
    unbonding_height: string
    unbonding_time: string
    commission: Commission.Data
    voting_powers: Coins.Data
    voting_power: string
  }

  export type Proto = Validator_pb

  export class Description extends JSONSerializable<
    Description.Amino,
    Description.Data,
    Description.Proto
  > {
    /**
     * @param moniker identifying name, e.g. "Hashed"
     * @param identity time at which commission was last updated
     * @param website validator's website
     * @param details long description
     * @param security_contact validator's contact
     */
    constructor(
      public moniker: string,
      public identity: string,
      public website: string,
      public details: string,
      public security_contact: string
    ) {
      super()
    }

    public static fromAmino(data: Description.Amino): Description {
      return new Description(
        data.moniker,
        data.identity ?? '',
        data.website ?? '',
        data.details ?? '',
        data.security_contact ?? ''
      )
    }

    public toAmino(): Description.Amino {
      return {
        moniker: this.moniker,
        identity: this.identity,
        website: this.website,
        details: this.details,
        security_contact: this.security_contact,
      }
    }

    public static fromData(data: Description.Data): Description {
      return new Description(
        data.moniker,
        data.identity ?? '',
        data.website ?? '',
        data.details ?? '',
        data.security_contact ?? ''
      )
    }

    public toData(): Description.Data {
      return {
        moniker: this.moniker,
        identity: this.identity,
        website: this.website,
        details: this.details,
        security_contact: this.security_contact,
      }
    }

    public static fromProto(proto: Description.Proto): Description {
      return new Description(
        proto.moniker,
        proto.identity,
        proto.website,
        proto.details,
        proto.securityContact
      )
    }

    public toProto(): Description.Proto {
      const { moniker, identity, website, details, security_contact } = this

      return Description_pb.fromPartial({
        details,
        identity,
        moniker,
        securityContact: security_contact,
        website,
      })
    }
  }

  export namespace Description {
    export interface Amino {
      moniker: string
      identity: string
      website: string
      details: string
      security_contact: string
    }

    export interface Data {
      moniker: string
      identity: string
      website: string
      details: string
      security_contact: string
    }

    export type Proto = Description_pb
  }

  export class CommissionRates extends JSONSerializable<
    CommissionRates.Amino,
    CommissionRates.Data,
    CommissionRates.Proto
  > {
    /**
     * @param rate current commission rate
     * @param max_rate max commission rate
     * @param max_change_rate max percentage commission can change in 24hrs
     */
    constructor(
      public rate: string,
      public max_rate: string,
      public max_change_rate: string
    ) {
      super()
    }

    public static fromAmino(data: CommissionRates.Amino): CommissionRates {
      const { rate, max_rate, max_change_rate } = data
      return new CommissionRates(rate, max_rate, max_change_rate)
    }

    public toAmino(): Validator.CommissionRates.Amino {
      const { rate, max_rate, max_change_rate } = this
      return {
        rate,
        max_rate,
        max_change_rate,
      }
    }

    public static fromData(data: CommissionRates.Data): CommissionRates {
      const { rate, max_rate, max_change_rate } = data
      return new CommissionRates(rate, max_rate, max_change_rate)
    }

    public toData(): Validator.CommissionRates.Data {
      const { rate, max_rate, max_change_rate } = this
      return {
        rate,
        max_rate,
        max_change_rate,
      }
    }

    public static fromProto(proto: CommissionRates.Proto): CommissionRates {
      return new CommissionRates(proto.rate, proto.maxRate, proto.maxChangeRate)
    }

    public toProto(): Validator.CommissionRates.Proto {
      const { rate, max_rate, max_change_rate } = this
      return CommissionRates_pb.fromPartial({
        maxChangeRate: max_change_rate,
        maxRate: max_rate,
        rate,
      })
    }
  }

  export namespace CommissionRates {
    export interface Amino {
      rate: string
      max_rate: string
      max_change_rate: string
    }

    export interface Data {
      rate: string
      max_rate: string
      max_change_rate: string
    }

    export type Proto = CommissionRates_pb
  }

  export class Commission extends JSONSerializable<
    Commission.Amino,
    Commission.Data,
    Commission.Proto
  > {
    /**
     * @param commission_rates commission rates
     * @param update_time time at which commission was last updated
     */
    constructor(
      public commission_rates: CommissionRates,
      public update_time: Date
    ) {
      super()
    }

    public static fromAmino(data: Commission.Amino): Commission {
      return new Commission(
        CommissionRates.fromAmino(data.commission_rates),
        new Date(data.update_time)
      )
    }

    public toAmino(): Commission.Amino {
      return {
        commission_rates: this.commission_rates.toAmino(),
        update_time: this.update_time.toISOString(),
      }
    }

    public static fromData(data: Commission.Data): Commission {
      return new Commission(
        CommissionRates.fromData(data.commission_rates),
        new Date(data.update_time)
      )
    }

    public toData(): Commission.Data {
      return {
        commission_rates: this.commission_rates.toData(),
        update_time: this.update_time.toISOString(),
      }
    }

    public static fromProto(proto: Commission.Proto): Commission {
      return new Commission(
        CommissionRates.fromProto(
          proto.commissionRates as CommissionRates.Proto
        ),
        proto.updateTime as Date
      )
    }

    public toProto(): Commission.Proto {
      const { commission_rates, update_time } = this
      return Commission_pb.fromPartial({
        commissionRates: commission_rates.toProto(),
        updateTime: update_time,
      })
    }
  }

  export namespace Commission {
    export interface Amino {
      commission_rates: CommissionRates.Amino
      update_time: string
    }

    export interface Data {
      commission_rates: CommissionRates.Data
      update_time: string
    }

    export type Proto = Commission_pb
  }
}
