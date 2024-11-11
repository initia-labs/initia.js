import { JSONSerializable } from '../../../util/json'
import { ContractMigrationAuthorization as ContractMigrationAuthorization_pb } from '@initia/initia.proto/cosmwasm/wasm/v1/authz'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { ContractGrant } from './ContractGrant'

/**
 * ContractMigrationAuthorization defines authorization for wasm contract migration.
 */
export class ContractMigrationAuthorization extends JSONSerializable<
  ContractMigrationAuthorization.Amino,
  ContractMigrationAuthorization.Data,
  ContractMigrationAuthorization.Proto
> {
  /**
   * @param grants grants for contract migrations
   */
  constructor(public grants: ContractGrant[]) {
    super()
  }

  public static fromAmino(
    data: ContractMigrationAuthorization.Amino
  ): ContractMigrationAuthorization {
    return new ContractMigrationAuthorization(
      data.value.grants.map(ContractGrant.fromAmino)
    )
  }

  public toAmino(): ContractMigrationAuthorization.Amino {
    return {
      type: 'wasm/ContractMigrationAuthorization',
      value: { grants: this.grants.map((grant) => grant.toAmino()) },
    }
  }

  public static fromData(
    data: ContractMigrationAuthorization.Data
  ): ContractMigrationAuthorization {
    return new ContractMigrationAuthorization(
      data.grants.map(ContractGrant.fromData)
    )
  }

  public toData(): ContractMigrationAuthorization.Data {
    return {
      '@type': '/cosmwasm.wasm.v1.ContractMigrationAuthorization',
      grants: this.grants.map((grant) => grant.toData()),
    }
  }

  public static fromProto(
    data: ContractMigrationAuthorization.Proto
  ): ContractMigrationAuthorization {
    return new ContractMigrationAuthorization(
      data.grants.map(ContractGrant.fromProto)
    )
  }

  public toProto(): ContractMigrationAuthorization.Proto {
    return ContractMigrationAuthorization_pb.fromPartial({
      grants: this.grants.map((grant) => grant.toProto()),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.ContractMigrationAuthorization',
      value: ContractMigrationAuthorization_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): ContractMigrationAuthorization {
    return ContractMigrationAuthorization.fromProto(
      ContractMigrationAuthorization_pb.decode(msgAny.value)
    )
  }
}

export namespace ContractMigrationAuthorization {
  export interface Amino {
    type: 'wasm/ContractMigrationAuthorization'
    value: {
      grants: ContractGrant.Amino[]
    }
  }

  export interface Data {
    '@type': '/cosmwasm.wasm.v1.ContractMigrationAuthorization'
    grants: ContractGrant.Data[]
  }

  export type Proto = ContractMigrationAuthorization_pb
}
