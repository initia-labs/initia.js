import { AllowAllMessagesFilter } from './AllowAllMessagesFilter'
import { AcceptedMessageKeysFilter } from './AcceptedMessageKeysFilter'
import { AcceptedMessagesFilter } from './AcceptedMessagesFilter'
import { Any } from '@initia/initia.proto/google/protobuf/any'

export type ContractFilter =
  | AllowAllMessagesFilter
  | AcceptedMessageKeysFilter
  | AcceptedMessagesFilter

export namespace ContractFilter {
  export type Amino =
    | AllowAllMessagesFilter.Amino
    | AcceptedMessageKeysFilter.Amino
    | AcceptedMessagesFilter.Amino
  export type Data =
    | AllowAllMessagesFilter.Data
    | AcceptedMessageKeysFilter.Data
    | AcceptedMessagesFilter.Data
  export type Proto =
    | AllowAllMessagesFilter.Proto
    | AcceptedMessageKeysFilter.Proto
    | AcceptedMessagesFilter.Proto

  export function fromAmino(data: ContractFilter.Amino): ContractFilter {
    switch (data.type) {
      case 'wasm/AllowAllMessagesFilter':
        return AllowAllMessagesFilter.fromAmino(data)
      case 'wasm/AcceptedMessageKeysFilter':
        return AcceptedMessageKeysFilter.fromAmino(data)
      case 'wasm/AcceptedMessagesFilter':
        return AcceptedMessagesFilter.fromAmino(data)
    }
  }

  export function fromData(data: ContractFilter.Data): ContractFilter {
    switch (data['@type']) {
      case '/cosmwasm.wasm.v1.AllowAllMessagesFilter':
        return AllowAllMessagesFilter.fromData(data)
      case '/cosmwasm.wasm.v1.AcceptedMessageKeysFilter':
        return AcceptedMessageKeysFilter.fromData(data)
      case '/cosmwasm.wasm.v1.AcceptedMessagesFilter':
        return AcceptedMessagesFilter.fromData(data)
    }
  }

  export function fromProto(proto: Any): ContractFilter {
    const typeUrl = proto.typeUrl
    switch (typeUrl) {
      case '/cosmwasm.wasm.v1.AllowAllMessagesFilter':
        return AllowAllMessagesFilter.unpackAny(proto)
      case '/cosmwasm.wasm.v1.AcceptedMessageKeysFilter':
        return AcceptedMessageKeysFilter.unpackAny(proto)
      case '/cosmwasm.wasm.v1.AcceptedMessagesFilter':
        return AcceptedMessagesFilter.unpackAny(proto)
    }

    throw new Error(`ContractFilter type ${typeUrl} not recognized`)
  }
}
