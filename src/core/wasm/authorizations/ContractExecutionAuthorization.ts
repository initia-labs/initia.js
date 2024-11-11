import { JSONSerializable } from '../../../util/json'
import { ContractExecutionAuthorization as ContractExecutionAuthorization_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/authz'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { ContractGrant } from './ContractGrant'

/**
 * ContractExecutionAuthorization defines authorization for wasm execute.
 */
export class ContractExecutionAuthorization extends JSONSerializable<
  ContractExecutionAuthorization.Amino,
  ContractExecutionAuthorization.Data,
  ContractExecutionAuthorization.Proto
> {
  /**
   * @param grants grants for contract executions
   */
  constructor(public grants: ContractGrant[]) {
    super()
  }

  public static fromAmino(
    data: ContractExecutionAuthorization.Amino
  ): ContractExecutionAuthorization {
    return new ContractExecutionAuthorization(
      data.value.grants.map(ContractGrant.fromAmino)
    )
  }

  public toAmino(): ContractExecutionAuthorization.Amino {
    return {
      type: 'wasm/ContractExecutionAuthorization',
      value: { grants: this.grants.map((grant) => grant.toAmino()) },
    }
  }

  public static fromData(
    data: ContractExecutionAuthorization.Data
  ): ContractExecutionAuthorization {
    return new ContractExecutionAuthorization(
      data.grants.map(ContractGrant.fromData)
    )
  }

  public toData(): ContractExecutionAuthorization.Data {
    return {
      '@type': '/cosmwasm.wasm.v1.ContractExecutionAuthorization',
      grants: this.grants.map((grant) => grant.toData()),
    }
  }

  public static fromProto(
    data: ContractExecutionAuthorization.Proto
  ): ContractExecutionAuthorization {
    return new ContractExecutionAuthorization(
      data.grants.map(ContractGrant.fromProto)
    )
  }

  public toProto(): ContractExecutionAuthorization.Proto {
    return ContractExecutionAuthorization_pb.fromPartial({
      grants: this.grants.map((grant) => grant.toProto()),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.ContractExecutionAuthorization',
      value: ContractExecutionAuthorization_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): ContractExecutionAuthorization {
    return ContractExecutionAuthorization.fromProto(
      ContractExecutionAuthorization_pb.decode(msgAny.value)
    )
  }
}

export namespace ContractExecutionAuthorization {
  export interface Amino {
    type: 'wasm/ContractExecutionAuthorization'
    value: {
      grants: ContractGrant.Amino[]
    }
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.ContractExecutionAuthorization'
    grants: ContractGrant.Data[]
  }

  export type Proto = ContractExecutionAuthorization_pb
}
