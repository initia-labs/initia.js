import { JSONSerializable } from '../../../util/json'
import { GenericAuthorization } from './GenericAuthorization'
import { SendAuthorization } from './SendAuthorization'
import { StakeAuthorization } from './StakeAuthorization'
import { PublishAuthorization } from './PublishAuthorization'
import { ExecuteAuthorization } from './ExecuteAuthorization'
import {
  StoreCodeAuthorization,
  ContractExecutionAuthorization,
  ContractMigrationAuthorization,
} from '../../wasm'
import { TransferAuthorization } from '../../ibc/applications/transfer'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { Grant as Grant_pb } from '@initia/initia.proto/cosmos/authz/v1beta1/authz'

export class AuthorizationGrant extends JSONSerializable<
  AuthorizationGrant.Amino,
  AuthorizationGrant.Data,
  AuthorizationGrant.Proto
> {
  constructor(
    public authorization: Authorization,
    public expiration?: Date
  ) {
    super()
  }

  public static fromAmino(amino: AuthorizationGrant.Amino): AuthorizationGrant {
    const { authorization, expiration } = amino
    return new AuthorizationGrant(
      Authorization.fromAmino(authorization),
      expiration ? new Date(expiration) : undefined
    )
  }

  public toAmino(): AuthorizationGrant.Amino {
    const { authorization, expiration } = this
    return {
      authorization: authorization.toAmino(),
      expiration: expiration?.toISOString(),
    }
  }

  public static fromData(data: AuthorizationGrant.Data): AuthorizationGrant {
    const { authorization, expiration } = data
    return new AuthorizationGrant(
      Authorization.fromData(authorization),
      expiration ? new Date(expiration) : undefined
    )
  }

  public toData(): AuthorizationGrant.Data {
    const { authorization, expiration } = this
    return {
      authorization: authorization.toData(),
      expiration: expiration?.toISOString(),
    }
  }

  public static fromProto(proto: AuthorizationGrant.Proto): AuthorizationGrant {
    return new AuthorizationGrant(
      Authorization.fromProto(proto.authorization as Any),
      proto.expiration
    )
  }

  public toProto(): AuthorizationGrant.Proto {
    const { authorization, expiration } = this
    return Grant_pb.fromPartial({
      authorization: authorization.packAny(),
      expiration,
    })
  }
}

export namespace AuthorizationGrant {
  export interface Amino {
    authorization: Authorization.Amino
    expiration?: string
  }

  export interface Data {
    authorization: Authorization.Data
    expiration?: string
  }

  export type Proto = Grant_pb
}

export type Authorization =
  | SendAuthorization
  | GenericAuthorization
  | StakeAuthorization
  | PublishAuthorization
  | ExecuteAuthorization
  | StoreCodeAuthorization
  | ContractExecutionAuthorization
  | ContractMigrationAuthorization
  | TransferAuthorization

export namespace Authorization {
  export type Amino =
    | SendAuthorization.Amino
    | GenericAuthorization.Amino
    | StakeAuthorization.Amino
    | PublishAuthorization.Amino
    | ExecuteAuthorization.Amino
    | StoreCodeAuthorization.Amino
    | ContractExecutionAuthorization.Amino
    | ContractMigrationAuthorization.Amino
  export type Data =
    | SendAuthorization.Data
    | GenericAuthorization.Data
    | StakeAuthorization.Data
    | PublishAuthorization.Data
    | ExecuteAuthorization.Data
    | StoreCodeAuthorization.Data
    | ContractExecutionAuthorization.Data
    | ContractMigrationAuthorization.Data
    | TransferAuthorization.Data
  export type Proto =
    | SendAuthorization.Proto
    | GenericAuthorization.Proto
    | StakeAuthorization.Proto
    | PublishAuthorization.Proto
    | ExecuteAuthorization.Proto
    | StoreCodeAuthorization.Proto
    | ContractExecutionAuthorization.Proto
    | ContractMigrationAuthorization.Proto
    | TransferAuthorization.Proto

  export function fromAmino(data: Authorization.Amino): Authorization {
    switch (data.type) {
      case 'cosmos-sdk/SendAuthorization':
        return SendAuthorization.fromAmino(data)
      case 'cosmos-sdk/GenericAuthorization':
        return GenericAuthorization.fromAmino(data)
      case 'mstake/StakeAuthorization':
        return StakeAuthorization.fromAmino(data)
      case 'move/ExecuteAuthorization':
        return ExecuteAuthorization.fromAmino(data)
      case 'move/PublishAuthorization':
        return PublishAuthorization.fromAmino(data)
      case 'wasm/StoreCodeAuthorization':
        return StoreCodeAuthorization.fromAmino(data)
      case 'wasm/ContractExecutionAuthorization':
        return ContractExecutionAuthorization.fromAmino(data)
      case 'wasm/ContractMigrationAuthorization':
        return ContractMigrationAuthorization.fromAmino(data)
    }
  }

  export function fromData(data: Authorization.Data): Authorization {
    switch (data['@type']) {
      case '/cosmos.authz.v1beta1.GenericAuthorization':
        return GenericAuthorization.fromData(data)
      case '/cosmos.bank.v1beta1.SendAuthorization':
        return SendAuthorization.fromData(data)
      case '/initia.mstaking.v1.StakeAuthorization':
        return StakeAuthorization.fromData(data)
      case '/initia.move.v1.PublishAuthorization':
        return PublishAuthorization.fromData(data)
      case '/initia.move.v1.ExecuteAuthorization':
        return ExecuteAuthorization.fromData(data)
      case '/cosmwasm.wasm.v1.StoreCodeAuthorization':
        return StoreCodeAuthorization.fromData(data)
      case '/cosmwasm.wasm.v1.ContractExecutionAuthorization':
        return ContractExecutionAuthorization.fromData(data)
      case '/cosmwasm.wasm.v1.ContractMigrationAuthorization':
        return ContractMigrationAuthorization.fromData(data)
      case '/ibc.applications.transfer.v1.TransferAuthorization':
        return TransferAuthorization.fromData(data)
    }
  }

  export function fromProto(proto: Any): Authorization {
    const typeUrl = proto.typeUrl
    switch (typeUrl) {
      case '/cosmos.authz.v1beta1.GenericAuthorization':
        return GenericAuthorization.unpackAny(proto)
      case '/cosmos.bank.v1beta1.SendAuthorization':
        return SendAuthorization.unpackAny(proto)
      case '/initia.mstaking.v1.StakeAuthorization':
        return StakeAuthorization.unpackAny(proto)
      case '/initia.move.v1.PublishAuthorization':
        return PublishAuthorization.unpackAny(proto)
      case '/initia.move.v1.ExecuteAuthorization':
        return ExecuteAuthorization.unpackAny(proto)
      case '/cosmwasm.wasm.v1.StoreCodeAuthorization':
        return StoreCodeAuthorization.unpackAny(proto)
      case '/cosmwasm.wasm.v1.ContractExecutionAuthorization':
        return ContractExecutionAuthorization.unpackAny(proto)
      case '/cosmwasm.wasm.v1.ContractMigrationAuthorization':
        return ContractMigrationAuthorization.unpackAny(proto)
      case '/ibc.applications.transfer.v1.TransferAuthorization':
        return TransferAuthorization.unpackAny(proto)
    }

    throw new Error(`Authorization type ${typeUrl} not recognized`)
  }
}
