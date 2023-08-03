import { JSONSerializable } from '../../util/json';
import { Params as Params_pb } from '@initia/initia.proto/initia/move/v1/types';
import Long from 'long';

export class MoveParams extends JSONSerializable<
  MoveParams.Amino,
  MoveParams.Data,
  MoveParams.Proto
> {
  /**
   * @param max_module_size
   * @param base_denom
   * @param base_min_gas_price
   * @param arbitrary_enabled
   * @param contract_shared_revenue_ratio the percentage of fees distributed to developers
   */
  constructor(
    public max_module_size: number,
    public base_denom: string,
    public base_min_gas_price: string,
    public arbitrary_enabled: boolean,
    public contract_shared_revenue_ratio: string
  ) {
    super();
  }

  public static fromAmino(data: MoveParams.Amino): MoveParams {
    const {
      value: {
        max_module_size,
        base_denom,
        base_min_gas_price,
        arbitrary_enabled,
        contract_shared_revenue_ratio,
      },
    } = data;
    return new MoveParams(
      Number.parseInt(max_module_size),
      base_denom,
      base_min_gas_price,
      arbitrary_enabled,
      contract_shared_revenue_ratio
    );
  }

  public toAmino(): MoveParams.Amino {
    const {
      max_module_size,
      base_denom,
      base_min_gas_price,
      arbitrary_enabled,
      contract_shared_revenue_ratio,
    } = this;
    return {
      type: 'move/Params',
      value: {
        max_module_size: max_module_size.toString(),
        base_denom,
        base_min_gas_price,
        arbitrary_enabled,
        contract_shared_revenue_ratio,
      },
    };
  }

  public static fromData(data: MoveParams.Data): MoveParams {
    const {
      max_module_size,
      base_denom,
      base_min_gas_price,
      arbitrary_enabled,
      contract_shared_revenue_ratio,
    } = data;
    return new MoveParams(
      Number.parseInt(max_module_size),
      base_denom,
      base_min_gas_price,
      arbitrary_enabled,
      contract_shared_revenue_ratio
    );
  }

  public toData(): MoveParams.Data {
    const {
      max_module_size,
      base_denom,
      base_min_gas_price,
      arbitrary_enabled,
      contract_shared_revenue_ratio,
    } = this;
    return {
      '@type': '/initia.move.v1.Params',
      max_module_size: max_module_size.toString(),
      base_denom,
      base_min_gas_price,
      arbitrary_enabled,
      contract_shared_revenue_ratio,
    };
  }

  public static fromProto(data: MoveParams.Proto): MoveParams {
    return new MoveParams(
      data.maxModuleSize.toNumber(),
      data.baseDenom,
      data.baseMinGasPrice,
      data.arbitraryEnabled,
      data.contractSharedRevenueRatio
    );
  }

  public toProto(): MoveParams.Proto {
    const {
      max_module_size,
      base_denom,
      base_min_gas_price,
      arbitrary_enabled,
      contract_shared_revenue_ratio,
    } = this;
    return Params_pb.fromPartial({
      maxModuleSize: Long.fromNumber(max_module_size),
      baseDenom: base_denom,
      baseMinGasPrice: base_min_gas_price,
      arbitraryEnabled: arbitrary_enabled,
      contractSharedRevenueRatio: contract_shared_revenue_ratio,
    });
  }
}

export namespace MoveParams {
  export interface Amino {
    type: 'move/Params';
    value: {
      max_module_size: string;
      base_denom: string;
      base_min_gas_price: string;
      arbitrary_enabled: boolean;
      contract_shared_revenue_ratio: string;
    };
  }

  export interface Data {
    '@type': '/initia.move.v1.Params';
    max_module_size: string;
    base_denom: string;
    base_min_gas_price: string;
    arbitrary_enabled: boolean;
    contract_shared_revenue_ratio: string;
  }

  export type Proto = Params_pb;
}
