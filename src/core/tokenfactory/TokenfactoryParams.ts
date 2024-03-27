import { JSONSerializable } from '../../util/json';
import { Coins } from '../Coins';
import { Params as Params_pb } from '@initia/initia.proto/miniwasm/tokenfactory/v1/params';
import Long from 'long';

export class TokenfactoryParams extends JSONSerializable<
  TokenfactoryParams.Amino,
  TokenfactoryParams.Data,
  TokenfactoryParams.Proto
> {
  public denom_creation_fee: Coins;
  /**
   * @param denom_creation_fee the fee to be charged on the creation of a new denom
   * @param denom_creation_gas_consume the gas cost for creating a new denom
   */
  constructor(
    denom_creation_fee: Coins.Input,
    public denom_creation_gas_consume: number
  ) {
    super();
    this.denom_creation_fee = new Coins(denom_creation_fee);
  }

  public static fromAmino(data: TokenfactoryParams.Amino): TokenfactoryParams {
    const { denom_creation_fee, denom_creation_gas_consume } = data;
    return new TokenfactoryParams(
      Coins.fromAmino(denom_creation_fee),
      Number.parseInt(denom_creation_gas_consume)
    );
  }

  public toAmino(): TokenfactoryParams.Amino {
    const { denom_creation_fee, denom_creation_gas_consume } = this;
    return {
      denom_creation_fee: denom_creation_fee.toAmino(),
      denom_creation_gas_consume: denom_creation_gas_consume.toString(),
    };
  }

  public static fromData(data: TokenfactoryParams.Data): TokenfactoryParams {
    const { denom_creation_fee, denom_creation_gas_consume } = data;
    return new TokenfactoryParams(
      Coins.fromData(denom_creation_fee),
      Number.parseInt(denom_creation_gas_consume)
    );
  }

  public toData(): TokenfactoryParams.Data {
    const { denom_creation_fee, denom_creation_gas_consume } = this;
    return {
      denom_creation_fee: denom_creation_fee.toData(),
      denom_creation_gas_consume: denom_creation_gas_consume.toString(),
    };
  }

  public static fromProto(data: TokenfactoryParams.Proto): TokenfactoryParams {
    return new TokenfactoryParams(
      Coins.fromProto(data.denomCreationFee),
      data.denomCreationGasConsume.toNumber()
    );
  }

  public toProto(): TokenfactoryParams.Proto {
    const { denom_creation_fee, denom_creation_gas_consume } = this;
    return Params_pb.fromPartial({
      denomCreationFee: denom_creation_fee.toProto(),
      denomCreationGasConsume: Long.fromNumber(denom_creation_gas_consume),
    });
  }
}

export namespace TokenfactoryParams {
  export interface Amino {
    denom_creation_fee: Coins.Amino;
    denom_creation_gas_consume: string;
  }

  export interface Data {
    denom_creation_fee: Coins.Data;
    denom_creation_gas_consume: string;
  }

  export type Proto = Params_pb;
}
