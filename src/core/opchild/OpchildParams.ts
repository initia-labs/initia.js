import { JSONSerializable } from '../../util/json'
import { Coins } from '../Coins'
import { AccAddress } from '../bech32'
import { Params as Params_pb } from '@initia/opinit.proto/opinit/opchild/v1/types'

/**
 * OpchildParams defines the set of opchild parameters.
 */
export class OpchildParams extends JSONSerializable<
  OpchildParams.Amino,
  OpchildParams.Data,
  OpchildParams.Proto
> {
  public min_gas_prices: Coins

  /**
   * @param max_validators the maximum number of validators
   * @param historical_entries the number of historical entries to persist
   * @param min_gas_prices
   * @param bridge_executors the account addresses of bridge executor who can execute permissioned bridge messages
   * @param admin the account address of admin who can execute permissioned cosmos messages
   * @param fee_whitelist the list of addresses that are allowed to pay zero fee
   * @param hook_max_gas max gas for hook execution of `MsgFinalizeTokenDeposit`
   */
  constructor(
    public max_validators: number,
    public historical_entries: number,
    min_gas_prices: Coins.Input,
    public bridge_executors: AccAddress[],
    public admin: AccAddress,
    public fee_whitelist: string[],
    public hook_max_gas: number
  ) {
    super()
    this.min_gas_prices = new Coins(min_gas_prices)
  }

  public static fromAmino(data: OpchildParams.Amino): OpchildParams {
    const {
      value: {
        max_validators,
        historical_entries,
        min_gas_prices,
        bridge_executors,
        admin,
        fee_whitelist,
        hook_max_gas,
      },
    } = data

    return new OpchildParams(
      max_validators,
      historical_entries,
      Coins.fromAmino(min_gas_prices),
      bridge_executors ?? [],
      admin,
      fee_whitelist ?? [],
      parseInt(hook_max_gas)
    )
  }

  public toAmino(): OpchildParams.Amino {
    const {
      max_validators,
      historical_entries,
      min_gas_prices,
      bridge_executors,
      admin,
      fee_whitelist,
      hook_max_gas,
    } = this

    return {
      type: 'opchild/Params',
      value: {
        max_validators,
        historical_entries,
        min_gas_prices: min_gas_prices.toAmino(),
        bridge_executors: bridge_executors.length > 0 ? bridge_executors : null,
        admin,
        fee_whitelist: fee_whitelist.length > 0 ? fee_whitelist : null,
        hook_max_gas: hook_max_gas.toFixed(),
      },
    }
  }

  public static fromData(data: OpchildParams.Data): OpchildParams {
    const {
      max_validators,
      historical_entries,
      min_gas_prices,
      bridge_executors,
      admin,
      fee_whitelist,
      hook_max_gas,
    } = data

    return new OpchildParams(
      max_validators,
      historical_entries,
      Coins.fromData(min_gas_prices),
      bridge_executors,
      admin,
      fee_whitelist,
      parseInt(hook_max_gas)
    )
  }

  public toData(): OpchildParams.Data {
    const {
      max_validators,
      historical_entries,
      min_gas_prices,
      bridge_executors,
      admin,
      fee_whitelist,
      hook_max_gas,
    } = this

    return {
      '@type': '/opinit.opchild.v1.Params',
      max_validators,
      historical_entries,
      min_gas_prices: min_gas_prices.toData(),
      bridge_executors,
      admin,
      fee_whitelist,
      hook_max_gas: hook_max_gas.toFixed(),
    }
  }

  public static fromProto(data: OpchildParams.Proto): OpchildParams {
    return new OpchildParams(
      data.maxValidators,
      data.historicalEntries,
      Coins.fromProto(data.minGasPrices),
      data.bridgeExecutors,
      data.admin,
      data.feeWhitelist,
      Number(data.hookMaxGas)
    )
  }

  public toProto(): OpchildParams.Proto {
    const {
      max_validators,
      historical_entries,
      min_gas_prices,
      bridge_executors,
      admin,
      fee_whitelist,
      hook_max_gas,
    } = this

    return Params_pb.fromPartial({
      maxValidators: max_validators,
      historicalEntries: historical_entries,
      minGasPrices: min_gas_prices.toProto(),
      bridgeExecutors: bridge_executors,
      admin,
      feeWhitelist: fee_whitelist,
      hookMaxGas: BigInt(hook_max_gas),
    })
  }
}

export namespace OpchildParams {
  export interface Amino {
    type: 'opchild/Params'
    value: {
      max_validators: number
      historical_entries: number
      min_gas_prices: Coins.Amino
      bridge_executors: AccAddress[] | null
      admin: AccAddress
      fee_whitelist: string[] | null
      hook_max_gas: string
    }
  }

  export interface Data {
    '@type': '/opinit.opchild.v1.Params'
    max_validators: number
    historical_entries: number
    min_gas_prices: Coins.Data
    bridge_executors: AccAddress[]
    admin: AccAddress
    fee_whitelist: string[]
    hook_max_gas: string
  }

  export type Proto = Params_pb
}
