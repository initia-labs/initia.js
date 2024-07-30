import { JSONSerializable } from '../../util/json'
import { Params as Params_pb } from '@initia/initia.proto/initia/move/v1/types'

export class MoveParams extends JSONSerializable<
  MoveParams.Amino,
  MoveParams.Data,
  MoveParams.Proto
> {
  /**
   * @param base_denom
   * @param base_min_gas_price
   * @param contract_shared_revenue_ratio the percentage of fees distributed to developers
   * @param allowed_publishers list of addresses with permission to distribute contracts, empty list is interpreted as allowing anyone to distribute
   */
  constructor(
    public base_denom: string,
    public base_min_gas_price: string,
    public contract_shared_revenue_ratio: string,
    public allowed_publishers: string[]
  ) {
    super()
  }

  public static fromAmino(data: MoveParams.Amino): MoveParams {
    const {
      value: {
        base_denom,
        base_min_gas_price,
        contract_shared_revenue_ratio,
        allowed_publishers,
      },
    } = data
    return new MoveParams(
      base_denom,
      base_min_gas_price,
      contract_shared_revenue_ratio,
      allowed_publishers
    )
  }

  public toAmino(): MoveParams.Amino {
    const {
      base_denom,
      base_min_gas_price,
      contract_shared_revenue_ratio,
      allowed_publishers,
    } = this
    return {
      type: 'move/Params',
      value: {
        base_denom,
        base_min_gas_price,
        contract_shared_revenue_ratio,
        allowed_publishers,
      },
    }
  }

  public static fromData(data: MoveParams.Data): MoveParams {
    const {
      base_denom,
      base_min_gas_price,
      contract_shared_revenue_ratio,
      allowed_publishers,
    } = data
    return new MoveParams(
      base_denom,
      base_min_gas_price,
      contract_shared_revenue_ratio,
      allowed_publishers
    )
  }

  public toData(): MoveParams.Data {
    const {
      base_denom,
      base_min_gas_price,
      contract_shared_revenue_ratio,
      allowed_publishers,
    } = this
    return {
      '@type': '/initia.move.v1.Params',
      base_denom,
      base_min_gas_price,
      contract_shared_revenue_ratio,
      allowed_publishers,
    }
  }

  public static fromProto(data: MoveParams.Proto): MoveParams {
    return new MoveParams(
      data.baseDenom,
      data.baseMinGasPrice,
      data.contractSharedRevenueRatio,
      data.allowedPublishers
    )
  }

  public toProto(): MoveParams.Proto {
    const {
      base_denom,
      base_min_gas_price,
      contract_shared_revenue_ratio,
      allowed_publishers,
    } = this
    return Params_pb.fromPartial({
      baseDenom: base_denom,
      baseMinGasPrice: base_min_gas_price,
      contractSharedRevenueRatio: contract_shared_revenue_ratio,
      allowedPublishers: allowed_publishers,
    })
  }
}

export namespace MoveParams {
  export interface Amino {
    type: 'move/Params'
    value: {
      base_denom: string
      base_min_gas_price: string
      contract_shared_revenue_ratio: string
      allowed_publishers: string[]
    }
  }

  export interface Data {
    '@type': '/initia.move.v1.Params'
    base_denom: string
    base_min_gas_price: string
    contract_shared_revenue_ratio: string
    allowed_publishers: string[]
  }

  export type Proto = Params_pb
}
