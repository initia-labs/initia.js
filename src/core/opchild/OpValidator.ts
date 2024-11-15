import { JSONSerializable } from '../../util/json'
import { ValAddress } from '../bech32'
import { ValConsPublicKey } from '../PublicKey'
import { Validator as Validator_pb } from '@initia/opinit.proto/opinit/opchild/v1/types'
import { Any } from '@initia/initia.proto/google/protobuf/any'

/**
 * OpValidator defines a validator, together with the total amount of the
 * OpValidator's bond shares and their exchange rate to coins. Slashing results in
 * a decrease in the exchange rate, allowing correct calculation of future
 * undelegations without iterating over delegators. When coins are delegated to
 * this validator, the validator is credited with a delegation whose number of
 * bond shares is based on the amount of coins delegated divided by the current
 * exchange rate. Voting power can be calculated as total bonded shares
 * multiplied by exchange rate.
 */
export class OpValidator extends JSONSerializable<
  OpValidator.Amino,
  OpValidator.Data,
  OpValidator.Proto
> {
  /**
   * @param moniker
   * @param operator_address the address of the validator's operator
   * @param consensus_pubkey the consensus public key of the validator
   * @param cons_power
   */
  constructor(
    public moniker: string,
    public operator_address: ValAddress,
    public consensus_pubkey: ValConsPublicKey,
    public cons_power: number
  ) {
    super()
  }

  public static fromAmino(data: OpValidator.Amino): OpValidator {
    const { moniker, operator_address, consensus_pubkey, cons_power } = data
    return new OpValidator(
      moniker,
      operator_address,
      ValConsPublicKey.fromAmino(consensus_pubkey),
      parseInt(cons_power)
    )
  }

  public toAmino(): OpValidator.Amino {
    const { moniker, operator_address, consensus_pubkey, cons_power } = this
    return {
      moniker,
      operator_address,
      consensus_pubkey: consensus_pubkey.toAmino(),
      cons_power: cons_power.toFixed(),
    }
  }

  public static fromData(data: OpValidator.Data): OpValidator {
    const { moniker, operator_address, consensus_pubkey, cons_power } = data
    return new OpValidator(
      moniker,
      operator_address,
      ValConsPublicKey.fromData(consensus_pubkey),
      parseInt(cons_power)
    )
  }

  public toData(): OpValidator.Data {
    const { moniker, operator_address, consensus_pubkey, cons_power } = this
    return {
      moniker,
      operator_address,
      consensus_pubkey: consensus_pubkey.toData(),
      cons_power: cons_power.toFixed(),
    }
  }

  public static fromProto(data: OpValidator.Proto): OpValidator {
    return new OpValidator(
      data.moniker,
      data.operatorAddress,
      ValConsPublicKey.unpackAny(data.consensusPubkey as Any),
      Number(data.consPower)
    )
  }

  public toProto(): OpValidator.Proto {
    const { moniker, operator_address, consensus_pubkey, cons_power } = this
    return Validator_pb.fromPartial({
      moniker,
      operatorAddress: operator_address,
      consensusPubkey: consensus_pubkey.packAny(),
      consPower: BigInt(cons_power),
    })
  }
}

export namespace OpValidator {
  export interface Amino {
    moniker: string
    operator_address: ValAddress
    consensus_pubkey: ValConsPublicKey.Amino
    cons_power: string
  }

  export interface Data {
    moniker: string
    operator_address: ValAddress
    consensus_pubkey: ValConsPublicKey.Data
    cons_power: string
  }

  export type Proto = Validator_pb
}
