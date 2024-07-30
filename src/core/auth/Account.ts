import { Any } from '@initia/initia.proto/google/protobuf/any'
import { BaseAccount } from './BaseAccount'
import { ModuleAccount } from './ModuleAccount'

export type Account = BaseAccount | ModuleAccount

/**
 * Stores information about an account fetched from the blockchain.
 */
export namespace Account {
  export type Amino = BaseAccount.Amino | ModuleAccount.Amino
  export type Data = BaseAccount.Data | ModuleAccount.Data
  export type Proto = Any

  export function fromAmino(amino: Account.Amino): Account {
    switch (amino.type) {
      case 'cosmos-sdk/BaseAccount':
        return BaseAccount.fromAmino(amino)
      case 'cosmos-sdk/ModuleAccount':
        return ModuleAccount.fromAmino(amino)
    }
  }

  export function fromData(data: Account.Data): Account {
    switch (data['@type']) {
      case '/cosmos.auth.v1beta1.BaseAccount':
        return BaseAccount.fromData(data)
      case '/cosmos.auth.v1beta1.ModuleAccount':
        return ModuleAccount.fromData(data)
    }
  }

  export function fromProto(accountAny: Account.Proto): Account {
    const typeUrl = accountAny.typeUrl
    if (typeUrl === '/cosmos.auth.v1beta1.BaseAccount') {
      return BaseAccount.unpackAny(accountAny)
    } else if (typeUrl === '/cosmos.auth.v1beta1.ModuleAccount') {
      return ModuleAccount.unpackAny(accountAny)
    }

    throw new Error(`Account type ${typeUrl} not recognized`)
  }
}
