import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { ContractLimit } from './ContractLimit';
import { ContractFilter } from './ContractFilter';
import { ContractGrant as ContractGrant_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/authz';
import { Any } from '@initia/initia.proto/google/protobuf/any';

export class ContractGrant extends JSONSerializable<
  ContractGrant.Amino,
  ContractGrant.Data,
  ContractGrant.Proto
> {
  /**
   * @param contract the bech32 address of the smart contract
   * @param limit execution limits that are enforced and updated when the grant is applied
   * @param filter more fine-grained control on the message payload passed to the contract in the operation
   */
  constructor(
    public contract: AccAddress,
    public limit: ContractLimit,
    public filter: ContractFilter
  ) {
    super();
  }

  public static fromAmino(data: ContractGrant.Amino): ContractGrant {
    const { contract, limit, filter } = data;
    return new ContractGrant(
      contract,
      ContractLimit.fromAmino(limit),
      ContractFilter.fromAmino(filter)
    );
  }

  public toAmino(): ContractGrant.Amino {
    const { contract, limit, filter } = this;
    return {
      contract,
      limit: limit.toAmino(),
      filter: filter.toAmino(),
    };
  }

  public static fromData(data: ContractGrant.Data): ContractGrant {
    const { contract, limit, filter } = data;
    return new ContractGrant(
      contract,
      ContractLimit.fromData(limit),
      ContractFilter.fromData(filter)
    );
  }

  public toData(): ContractGrant.Data {
    const { contract, limit, filter } = this;
    return {
      contract,
      limit: limit.toData(),
      filter: filter.toData(),
    };
  }

  public static fromProto(data: ContractGrant.Proto): ContractGrant {
    return new ContractGrant(
      data.contract,
      ContractLimit.fromProto(data.limit as Any),
      ContractFilter.fromProto(data.filter as Any)
    );
  }

  public toProto(): ContractGrant.Proto {
    const { contract, limit, filter } = this;
    return ContractGrant_pb.fromPartial({
      contract,
      limit: limit.packAny(),
      filter: filter.packAny(),
    });
  }
}

export namespace ContractGrant {
  export interface Amino {
    contract: AccAddress;
    limit: ContractLimit.Amino;
    filter: ContractFilter.Amino;
  }

  export interface Data {
    contract: AccAddress;
    limit: ContractLimit.Data;
    filter: ContractFilter.Data;
  }

  export type Proto = ContractGrant_pb;
}
