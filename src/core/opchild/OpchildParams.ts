import { JSONSerializable } from '../../util/json';
import { Coins } from '../Coins';
import { AccAddress } from '../bech32';
import { Params as Params_pb } from '@initia/opinit.proto/opinit/opchild/v1/types';

export class OpchildParams extends JSONSerializable<
  OpchildParams.Amino,
  OpchildParams.Data,
  OpchildParams.Proto
> {
  public min_gas_prices: Coins;

  /**
   * @param max_validators the maximum number of validators
   * @param historical_entries the number of historical entries to persist
   * @param min_gas_prices
   * @param bridge_executor the account address of bridge executor who can execute permissioned bridge messages
   * @param admin
   */
  constructor(
    public max_validators: number,
    public historical_entries: number,
    min_gas_prices: Coins.Input,
    public bridge_executor: AccAddress,
    public admin: AccAddress
  ) {
    super();
    this.min_gas_prices = new Coins(min_gas_prices);
  }

  public static fromAmino(data: OpchildParams.Amino): OpchildParams {
    const {
      value: {
        max_validators,
        historical_entries,
        min_gas_prices,
        bridge_executor,
        admin,
      },
    } = data;

    return new OpchildParams(
      max_validators,
      historical_entries,
      Coins.fromAmino(min_gas_prices),
      bridge_executor,
      admin
    );
  }

  public toAmino(): OpchildParams.Amino {
    const {
      max_validators,
      historical_entries,
      min_gas_prices,
      bridge_executor,
      admin,
    } = this;

    return {
      type: 'opchild/Params',
      value: {
        max_validators,
        historical_entries,
        min_gas_prices: min_gas_prices.toAmino(),
        bridge_executor,
        admin,
      },
    };
  }

  public static fromData(data: OpchildParams.Data): OpchildParams {
    const {
      max_validators,
      historical_entries,
      min_gas_prices,
      bridge_executor,
      admin,
    } = data;

    return new OpchildParams(
      max_validators,
      historical_entries,
      Coins.fromData(min_gas_prices),
      bridge_executor,
      admin
    );
  }

  public toData(): OpchildParams.Data {
    const {
      max_validators,
      historical_entries,
      min_gas_prices,
      bridge_executor,
      admin,
    } = this;

    return {
      '@type': '/opinit.opchild.v1.Params',
      max_validators,
      historical_entries,
      min_gas_prices: min_gas_prices.toData(),
      bridge_executor,
      admin,
    };
  }

  public static fromProto(data: OpchildParams.Proto): OpchildParams {
    return new OpchildParams(
      data.maxValidators,
      data.historicalEntries,
      Coins.fromProto(data.minGasPrices),
      data.bridgeExecutor,
      data.admin
    );
  }

  public toProto(): OpchildParams.Proto {
    const {
      max_validators,
      historical_entries,
      min_gas_prices,
      bridge_executor,
      admin,
    } = this;

    return Params_pb.fromPartial({
      maxValidators: max_validators,
      historicalEntries: historical_entries,
      minGasPrices: min_gas_prices.toProto(),
      bridgeExecutor: bridge_executor,
      admin,
    });
  }
}

export namespace OpchildParams {
  export interface Amino {
    type: 'opchild/Params';
    value: {
      max_validators: number;
      historical_entries: number;
      min_gas_prices: Coins.Amino;
      bridge_executor: AccAddress;
      admin: AccAddress;
    };
  }

  export interface Data {
    '@type': '/opinit.opchild.v1.Params';
    max_validators: number;
    historical_entries: number;
    min_gas_prices: Coins.Data;
    bridge_executor: AccAddress;
    admin: AccAddress;
  }

  export type Proto = Params_pb;
}
