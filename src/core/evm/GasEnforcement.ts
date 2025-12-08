import { JSONSerializable } from '../../util/json'
import { GasEnforcement as GasEnforcement_pb } from '@initia/initia.proto/minievm/evm/v1/types'

/**
 * GasEnforcement specifies the rules for enforcing gas usage on EVM transactions.
 */
export class GasEnforcement extends JSONSerializable<
  GasEnforcement.Amino,
  GasEnforcement.Data,
  GasEnforcement.Proto
> {
  /**
   * @param max_gas_fee_cap upper bound on the gas price (base fee + tip) for a single EVM transaction (set 0 to disable)
   * @param max_gas_limit the maximum gas limit allowed for a single EVM transaction (set 0 to disable)
   * @param unlimited_gas_senders list of addresses that are exempt from gas price and limit restrictions
   */
  constructor(
    public max_gas_fee_cap: string,
    public max_gas_limit: number,
    public unlimited_gas_senders: string[]
  ) {
    super()
  }

  public static fromAmino(data: GasEnforcement.Amino): GasEnforcement {
    const { max_gas_fee_cap, max_gas_limit, unlimited_gas_senders } = data
    return new GasEnforcement(
      max_gas_fee_cap,
      parseInt(max_gas_limit),
      unlimited_gas_senders
    )
  }

  public toAmino(): GasEnforcement.Amino {
    const { max_gas_fee_cap, max_gas_limit, unlimited_gas_senders } = this
    return {
      max_gas_fee_cap,
      max_gas_limit: max_gas_limit.toFixed(),
      unlimited_gas_senders,
    }
  }

  public static fromData(data: GasEnforcement.Data): GasEnforcement {
    const { max_gas_fee_cap, max_gas_limit, unlimited_gas_senders } = data
    return new GasEnforcement(
      max_gas_fee_cap,
      parseInt(max_gas_limit),
      unlimited_gas_senders
    )
  }

  public toData(): GasEnforcement.Data {
    const { max_gas_fee_cap, max_gas_limit, unlimited_gas_senders } = this
    return {
      max_gas_fee_cap,
      max_gas_limit: max_gas_limit.toFixed(),
      unlimited_gas_senders,
    }
  }

  public static fromProto(data: GasEnforcement.Proto): GasEnforcement {
    return new GasEnforcement(
      data.maxGasFeeCap,
      Number(data.maxGasLimit),
      data.unlimitedGasSenders
    )
  }

  public toProto(): GasEnforcement.Proto {
    const { max_gas_fee_cap, max_gas_limit, unlimited_gas_senders } = this
    return GasEnforcement_pb.fromPartial({
      maxGasFeeCap: max_gas_fee_cap,
      maxGasLimit: BigInt(max_gas_limit),
      unlimitedGasSenders: unlimited_gas_senders,
    })
  }
}

export namespace GasEnforcement {
  export interface Amino {
    max_gas_fee_cap: string
    max_gas_limit: string
    unlimited_gas_senders: string[]
  }

  export interface Data {
    max_gas_fee_cap: string
    max_gas_limit: string
    unlimited_gas_senders: string[]
  }

  export type Proto = GasEnforcement_pb
}
